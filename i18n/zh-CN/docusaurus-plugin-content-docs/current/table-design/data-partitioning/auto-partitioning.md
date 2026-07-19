---
{
    "title": "自动分区",
    "language": "zh-CN",
    "description": "Doris 自动分区（AUTO PARTITION）在数据导入时根据分区列取值自动创建 RANGE 或 LIST 分区，解决离散数据、海量分区无法预先建表的难题。"
}
---

<!-- 知识类型: 功能特性 / 操作步骤 -->
<!-- 适用场景: 分区表设计 / 大规模分区管理 / 数据生命周期管理 -->

自动分区（AUTO PARTITION）是 Doris 在数据导入过程中，根据分区列取值自动创建分区的能力。它面向以下问题：

- 分区列数据分布零散、难以预测，建表时无法准确列举所需分区
- 分区数量过大，手动创建繁琐
- 分区列与系统时间无关，动态分区无法覆盖

Doris 支持两种自动分区类型：

| 类型 | 分区方式 | 分区函数 | 支持的分区列类型 |
| --- | --- | --- | --- |
| AUTO **RANGE** PARTITION | 按范围自动分区 | `date_trunc` | `DATE`、`DATETIME` |
| AUTO **LIST** PARTITION | 按枚举值自动分区 | 不支持函数调用 | `BOOLEAN`、`TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT`、`DATE`、`DATETIME`、`CHAR`、`VARCHAR` |

## 使用场景

以时间类型分区列为例：

- 在动态分区中，Doris 支持按特定时间周期自动创建新分区，以容纳实时数据。对于实时用户行为日志等场景，该功能基本能够满足需求。
- 但在更复杂的场景下（例如处理非实时数据），分区列与当前系统时间无关，且包含大量离散值。此时虽希望按此列进行分区，但数据涉及的分区无法预先掌握，或所需分区数量过大。

这种情况下，动态分区或手动创建分区均无法满足需求，自动分区可以很好地覆盖此类场景。

### 场景示例：交易历史表

假设业务中存在一张交易历史表，按交易日期分区。使用手动分区时，DDL 通常如下：

```sql
CREATE TABLE `DAILY_TRADE_VALUE`
(
    `TRADE_DATE`              datev2 NOT NULL COMMENT '交易日期',
    `TRADE_ID`                varchar(40) NOT NULL COMMENT '交易编号',
    ......
)
UNIQUE KEY(`TRADE_DATE`, `TRADE_ID`)
PARTITION BY RANGE(`TRADE_DATE`)
(
    PARTITION p_2000 VALUES [('2000-01-01'), ('2001-01-01')),
    PARTITION p_2001 VALUES [('2001-01-01'), ('2002-01-01')),
    PARTITION p_2002 VALUES [('2002-01-01'), ('2003-01-01')),
    PARTITION p_2003 VALUES [('2003-01-01'), ('2004-01-01')),
    PARTITION p_2004 VALUES [('2004-01-01'), ('2005-01-01')),
    PARTITION p_2005 VALUES [('2005-01-01'), ('2006-01-01')),
    PARTITION p_2006 VALUES [('2006-01-01'), ('2007-01-01')),
    PARTITION p_2007 VALUES [('2007-01-01'), ('2008-01-01')),
    PARTITION p_2008 VALUES [('2008-01-01'), ('2009-01-01')),
    PARTITION p_2009 VALUES [('2009-01-01'), ('2010-01-01')),
    PARTITION p_2010 VALUES [('2010-01-01'), ('2011-01-01')),
    PARTITION p_2011 VALUES [('2011-01-01'), ('2012-01-01')),
    PARTITION p_2012 VALUES [('2012-01-01'), ('2013-01-01')),
    PARTITION p_2013 VALUES [('2013-01-01'), ('2014-01-01')),
    PARTITION p_2014 VALUES [('2014-01-01'), ('2015-01-01')),
    PARTITION p_2015 VALUES [('2015-01-01'), ('2016-01-01')),
    PARTITION p_2016 VALUES [('2016-01-01'), ('2017-01-01')),
    PARTITION p_2017 VALUES [('2017-01-01'), ('2018-01-01')),
    PARTITION p_2018 VALUES [('2018-01-01'), ('2019-01-01')),
    PARTITION p_2019 VALUES [('2019-01-01'), ('2020-01-01')),
    PARTITION p_2020 VALUES [('2020-01-01'), ('2021-01-01')),
    PARTITION p_2021 VALUES [('2021-01-01'), ('2022-01-01'))
)
DISTRIBUTED BY HASH(`TRADE_DATE`) BUCKETS 10
PROPERTIES (
  "replication_num" = "1"
);
```

这种方式存在以下问题：

1. 建表时需预先手动列出所有分区。
2. 当分区列数据范围发生变化（例如新增 2022 年数据）时，需通过 [ALTER-TABLE-PARTITION](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PARTITION) 修改分区，操作繁琐。
3. 若需要分区变更或更细粒度细分，修改成本较高。

使用 AUTO PARTITION 改写后，DDL 可简化为：

```sql
CREATE TABLE `DAILY_TRADE_VALUE`
(
    `TRADE_DATE`              datev2 NOT NULL,
    `TRADE_ID`                varchar(40) NOT NULL,
    ......
)
UNIQUE KEY(`TRADE_DATE`, `TRADE_ID`)
AUTO PARTITION BY RANGE (date_trunc(`TRADE_DATE`, 'year'))
(
)
DISTRIBUTED BY HASH(`TRADE_DATE`) BUCKETS 10
PROPERTIES (
  "replication_num" = "1"
);
```

新建表此时没有默认分区：

```sql
show partitions from `DAILY_TRADE_VALUE`;
Empty set (0.12 sec)
```

插入数据后，对应分区会被自动创建：

```sql
insert into `DAILY_TRADE_VALUE` values ('2012-12-13', 1), ('2008-02-03', 2), ('2014-11-11', 3);

show partitions from `DAILY_TRADE_VALUE`;
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
| PartitionId | PartitionName   | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize | IsInMemory | ReplicaAllocation       | IsMutable |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
| 180060      | p20080101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2008-01-01]; ..types: [DATEV2]; keys: [2009-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
| 180039      | p20120101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2012-01-01]; ..types: [DATEV2]; keys: [2013-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
| 180018      | p20140101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2014-01-01]; ..types: [DATEV2]; keys: [2015-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
```

通过自动分区创建的分区，与手动创建的分区在功能上完全一致。

## 语法

在 [CREATE-TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE) 的 `partitions_definition` 部分使用以下语法。

### AUTO RANGE PARTITION

```sql
[AUTO] PARTITION BY RANGE(<partition_expr>)
<origin_partitions_definition>
```

其中：

```sql
partition_expr ::= date_trunc(<partition_column>, '<interval>')
```

:::tip
在 AUTO RANGE PARTITION 中，`AUTO` 关键字可以省略，仍然表达自动分区含义。
:::

示例：

```sql
CREATE TABLE `date_table` (
    `TIME_STAMP` datev2 NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`TIME_STAMP`)
AUTO PARTITION BY RANGE (date_trunc(`TIME_STAMP`, 'month'))
(
)
DISTRIBUTED BY HASH(`TIME_STAMP`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### AUTO LIST PARTITION

```sql
AUTO PARTITION BY LIST(`partition_col1` [, `partition_col2`, ...])
<origin_partitions_definition>
```

LIST 自动分区支持多列分区，写法与普通 LIST 分区一致：`AUTO PARTITION BY LIST(`col1`, `col2`, ...)`。分区列的每个当前不存在对应分区的取值，都会创建一个独立的新分区。

示例：

```sql
CREATE TABLE `str_table` (
    `str` varchar not null
) ENGINE=OLAP
DUPLICATE KEY(`str`)
AUTO PARTITION BY LIST (`str`)
()
DISTRIBUTED BY HASH(`str`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 约束对比

| 约束项 | AUTO RANGE PARTITION | AUTO LIST PARTITION |
| --- | --- | --- |
| 支持的分区函数 | 仅支持 `date_trunc` | 不支持函数调用 |
| 支持的分区列类型 | `DATE`、`DATETIME` | `BOOLEAN`、`TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT`、`DATE`、`DATETIME`、`CHAR`、`VARCHAR` |
| 是否支持多列分区 | 否 | 是 |
| 分区名长度限制 | — | 不得超过 50（来自分区列内容拼接与转义，实际容许长度可能更短） |
| 分区取值规则 | 按 `date_trunc` 截断后的时间范围划分 | 每个未存在分区的枚举取值会创建一个独立新分区 |

## NULL 值分区

开启 session variable `allow_partition_column_nullable` 后，两类自动分区对 NULLABLE 列的支持有差异：

| 自动分区类型 | 是否支持 NULLABLE 分区列 |
| --- | --- |
| AUTO LIST PARTITION | 支持，写入 NULL 时会正常创建 NULL 分区 |
| AUTO RANGE PARTITION | 不支持 |

### AUTO LIST PARTITION：支持 NULLABLE 列

```sql
create table auto_null_list(
    k0 varchar null
)
auto partition by list (k0)
(
)
DISTRIBUTED BY HASH(`k0`) BUCKETS 1
properties("replication_num" = "1");

insert into auto_null_list values (null);

select * from auto_null_list;
+------+
| k0   |
+------+
| NULL |
+------+

select * from auto_null_list partition(pX);
+------+
| k0   |
+------+
| NULL |
+------+
```

### AUTO RANGE PARTITION：不支持 NULLABLE 列

```sql
CREATE TABLE `range_table_nullable` (
    `k1` INT,
    `k2` DATETIMEV2(3),
    `k3` DATETIMEV2(6)
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
AUTO PARTITION BY RANGE (date_trunc(`k2`, 'day'))
()
DISTRIBUTED BY HASH(`k1`) BUCKETS 16
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

ERROR 1105 (HY000): errCode = 2, detailMessage = AUTO RANGE PARTITION doesn't support NULL column
```

## 生命周期管理

:::info
Doris 支持同时使用自动分区与动态分区实现生命周期管理，现已不推荐。
:::

AUTO RANGE PARTITION 表支持通过 `partition.retention_count` 属性管理历史分区生命周期。该属性接受一个正整数 `N`，表示**只保留分区值最大的 `N` 个历史分区**；当前及未来分区全部保留。

### 概念定义

- **历史分区**：分区上界 <= 当前时间的分区。
- **当前及未来分区**：分区下界 >= 当前时间的分区。
- **分区值比较**：由于 RANGE 分区一定不相交，"分区 A 的值 > 分区 B 的值" 等价于 "分区 A 的下界值 > 分区 B 的上界值"，也等价于 "分区 A 的上界值 > 分区 B 的上界值"。

### 示例

```sql
create table auto_recycle(
    k0 datetime(6) not null
)
AUTO PARTITION BY RANGE (date_trunc(k0, 'day')) ()
DISTRIBUTED BY HASH(`k0`) BUCKETS 1
properties(
    "partition.retention_count" = "3"
);
```

该配置表示只保留历史分区日期值最大的 3 个分区。假设当前日期为 `2025-10-21`，插入 `2025-10-16` 至 `2025-10-23` 中每一天的数据。经过一次回收后，剩余 6 个分区，如下图所示：

![Recycle](/images/blogs/auto-partition-lifetime1.png)

剩余分区列表：

- p20251018000000
- p20251019000000
- p20251020000000（该分区及以上：只保留三个历史分区）
- p20251021000000（该分区及以下：当前及未来分区不受影响）
- p20251022000000
- p20251023000000

## 与自动分桶联用

只有 AUTO RANGE PARTITION 可以同时使用[自动分桶](./data-bucketing.md#自动设置分桶数)功能。

使用此组合时，Doris 假设表的数据导入按时间顺序增量进行，每次导入仅涉及一个分区。因此，**该组合仅推荐用于逐批次增量导入的表**。

:::warning 注意
如果数据导入方式不符合上述范式，且同时使用了自动分区和自动分桶，新分区的分桶数可能极不合理，对查询性能产生较大影响。
:::

## 分区管理

启用自动分区后，可通过以下两个工具精准定位分区：

- `auto_partition_name` 函数：根据分区列取值映射到分区名。
- `partitions` 表函数：根据分区名获取分区详细信息。

仍以 `DAILY_TRADE_VALUE` 表为例，插入数据后查询某条记录所属分区：

```sql
select * from partitions("catalog"="internal","database"="optest","table"="DAILY_TRADE_VALUE") where PartitionName = auto_partition_name('range', 'year', '2008-02-03');
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName   | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
|      127095 | p20080101000000 |              2 | 2024-11-14 17:29:02 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2008-01-01]; ..types: [DATEV2]; keys: [2009-01-01]; ) | TRADE_DATE      |      10 |              1 | HDD           | 9999-12-31 23:59:59 |                     | \N                       | 985.000 B |          0 | tag.location.default: 1 |         1 |                  1 | \N           |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```

通过该方式可以精准筛选每个分区的 ID 和取值，用于后续针对分区的具体操作（例如 `insert overwrite partition`）。

详细语法说明：

- [auto_partition_name 函数文档](../../sql-manual/sql-functions/scalar-functions/string-functions/auto-partition-name)
- [partitions 表函数文档](../../sql-manual/sql-functions/table-valued-functions/partitions)

## 注意事项

| 注意点 | 说明 |
| --- | --- |
| 多列分区支持 | AUTO LIST PARTITION 支持多列分区，语法与普通 LIST 分区一致。 |
| 失败导入的分区不会自动清理 | 数据插入或导入过程中创建了分区，但整个导入未完成（失败或被取消）时，已创建的分区不会被自动删除。 |
| 使用方式与普通分区一致 | 使用 AUTO PARTITION 的表，仅是分区创建方式由手动转为自动。表及分区的其他使用方法均与非 AUTO PARTITION 表相同。 |
| 最大分区数限制 | 通过 [FE 配置项](../../admin-manual/config/fe-config) 中的 `max_auto_partition_num` 控制单表最大分区数，可按需调整，避免意外创建过多分区。 |
| 数据发送轮询间隔 | 向 AUTO PARTITION 表导入数据时，Coordinator 发送数据的轮询间隔与普通表不同，由 [BE 配置项](../../admin-manual/config/be-config) 中的 `olap_table_sink_send_interval_auto_partition_factor` 控制。开启前移（`enable_memtable_on_sink_node = true`）后该变量不生效。 |
| INSERT OVERWRITE 行为 | 使用 [insert-overwrite](../../sql-manual/sql-statements/data-modification/DML/INSERT-OVERWRITE) 插入数据时 AUTO PARTITION 表的具体行为，详见 INSERT OVERWRITE 文档。 |
| 元数据冲突可能导致导入失败 | 导入创建分区时，若该表正在进行其他元数据操作（如 Schema Change、Rebalance），导入可能失败。 |
