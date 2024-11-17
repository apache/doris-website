---
{
    "title": "自动分区",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->


## 使用场景

自动分区功能主要解决了用户预期基于某列对表进行分区操作，但该列的数据分布比较零散或者难以预测，在建表或调整表结构时难以准确创建所需分区，或者分区数量过多以至于手动创建过于繁琐的问题。

以时间类型分区列为例，在动态分区功能中，我们支持了按特定时间周期自动创建新分区以容纳实时数据。对于实时的用户行为日志等场景该功能基本能够满足需求。但在一些更复杂的场景下，例如处理非实时数据时，分区列与当前系统时间无关，且包含大量离散值。此时为提高效率我们希望依据此列对数据进行分区，但数据实际可能涉及的分区无法预先掌握，或者预期所需分区数量过大。这种情况下动态分区或者手动创建分区无法满足我们的需求，自动分区功能很好地覆盖了此类需求。

假设我们的表 DDL 如下：

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

该表内存储了大量业务历史数据，依据交易发生的日期进行分区。可以看到在建表时，我们需要预先手动创建分区。如果分区列的数据范围发生变化，例如上表中增加了 2022 年的数据，则我们需要通过[ALTER-TABLE-PARTITION](../../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-TABLE-PARTITION)对表的分区进行更改。如果这种分区需要变更，或者进行更细粒度的细分，修改起来非常繁琐。此时我们就可以使用 AUTO PARTITION 改写该表 DDL。

## 语法

建表时，使用以下语法填充[CREATE-TABLE](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE)时的 `partition_info` 部分：

1. AUTO RANGE PARTITION:

```sql
   AUTO PARTITION BY RANGE (FUNC_CALL_EXPR)
   ()
```

其中
```sql
   FUNC_CALL_EXPR ::= date_trunc ( <partition_column>, '<interval>' )
```

2. AUTO LIST PARTITION:

```sql
    AUTO PARTITION BY LIST(`partition_col1`[, `partition_col2`, ...])
    ()
```

### 用法示例

1. AUTO RANGE PARTITION

```sql
   CREATE TABLE `date_table` (
       `TIME_STAMP` datev2 NOT NULL COMMENT '采集日期'
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

2. AUTO LIST PARTITION

```sql
   CREATE TABLE `str_table` (
       `str` varchar not null
   ) ENGINE=OLAP
   DUPLICATE KEY(`str`)
   AUTO PARTITION BY LIST (`str`)
   (
   )
   DISTRIBUTED BY HASH(`str`) BUCKETS 10
   PROPERTIES (
   "replication_allocation" = "tag.location.default: 1"
   );
```

   LIST 自动分区支持多个分区列，分区列写法同普通 LIST 分区一样： ```AUTO PARTITION BY LIST (`col1`, `col2`, ...)```

### 约束

1. 在 AUTO LIST PARTITION 中，**分区名长度不得超过 50**. 该长度来自于对应数据行上各分区列内容的拼接与转义，因此实际容许长度可能更短。
2. 在 AUTO RANGE PARTITION 中，分区函数仅支持 `date_trunc`，分区列仅支持 `DATE` 或者 `DATETIME` 类型；
3. 在 AUTO LIST PARTITION 中，不支持函数调用，分区列支持 `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `DATE`, `DATETIME`, `CHAR`, `VARCHAR` 数据类型，分区值为枚举值。
4. 在 AUTO LIST PARTITION 中，分区列的每个当前不存在对应分区的取值，都会创建一个独立的新 PARTITION。

### NULL 值分区

当开启 session variable `allow_partition_column_nullable` 后：

1. 对于 AUTO LIST PARTITION，可以使用 NULLABLE 列作为分区列，会正常创建对应的 NULL 值分区：

```sql
mysql> create table auto_null_list(
    -> k0 varchar null
    -> )
    -> auto partition by list (k0)
    -> (
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.10 sec)

mysql> insert into auto_null_list values (null);
Query OK, 1 row affected (0.28 sec)

mysql> select * from auto_null_list;
+------+
| k0   |
+------+
| NULL |
+------+
1 row in set (0.20 sec)

mysql> select * from auto_null_list partition(pX);
+------+
| k0   |
+------+
| NULL |
+------+
1 row in set (0.20 sec)
```

2. 对于 AUTO RANGE PARTITION，**不支持 NULLABLE 列作为分区列**。

```sql
mysql>  CREATE TABLE `range_table_nullable` (
    ->      `k1` INT,
    ->      `k2` DATETIMEV2(3),
    ->      `k3` DATETIMEV2(6)
    ->  ) ENGINE=OLAP
    ->  DUPLICATE KEY(`k1`)
    ->  AUTO PARTITION BY RANGE (date_trunc(`k2`, 'day'))
    ->  (
    ->  )
    ->  DISTRIBUTED BY HASH(`k1`) BUCKETS 16
    ->  PROPERTIES (
    ->  "replication_allocation" = "tag.location.default: 1"
    ->  );
ERROR 1105 (HY000): errCode = 2, detailMessage = AUTO RANGE PARTITION doesn't support NULL column
```

## 场景示例

在使用场景一节中的示例，在使用 AUTO PARTITION 后，该表 DDL 可以改写为：

```sql
CREATE TABLE `DAILY_TRADE_VALUE`
(
    `TRADE_DATE`              datev2 NOT NULL COMMENT '交易日期',
    `TRADE_ID`                varchar(40) NOT NULL COMMENT '交易编号',
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

以此表只有两列为例，此时新表没有默认分区：

```sql
mysql> show partitions from `DAILY_TRADE_VALUE`;
Empty set (0.12 sec)
```

经过插入数据后再查看，发现该表已经创建了对应的分区：

```sql
mysql> insert into `DAILY_TRADE_VALUE` values ('2012-12-13', 1), ('2008-02-03', 2), ('2014-11-11', 3);
Query OK, 3 rows affected (0.88 sec)

mysql> show partitions from `DAILY_TRADE_VALUE`;
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
| PartitionId | PartitionName   | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize | IsInMemory | ReplicaAllocation       | IsMutable |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
| 180060      | p20080101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2008-01-01]; ..types: [DATEV2]; keys: [2009-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
| 180039      | p20120101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2012-01-01]; ..types: [DATEV2]; keys: [2013-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
| 180018      | p20140101000000 | 2              | 2023-09-18 21:49:29 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2014-01-01]; ..types: [DATEV2]; keys: [2015-01-01]; ) | TRADE_DATE      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+
3 rows in set (0.12 sec)
```

经过自动分区功能所创建的 PARTITION，与手动创建的 PARTITION 具有完全一致的功能性质。

## 与动态分区联用

Doris 支持自动分区和动态分区同时使用。此时，二者的功能都生效：
1. 自动分区将会自动在数据导入过程中按需创建分区；
2. 动态分区将会自动创建、回收、转储分区。

二者语法功能不存在冲突，同时设置对应的子句/属性即可。

### 最佳实践

需要对分区生命周期设限的场景，可以**将 Dynamic Partition 的创建功能关闭，创建分区完全交由 Auto Partition 完成**，通过 Dynamic Partition 动态回收分区的功能完成分区生命周期的管理：

```sql
create table auto_dynamic(
    k0 datetime(6) NOT NULL
)
auto partition by range (date_trunc(k0, 'year'))
(
)
DISTRIBUTED BY HASH(`k0`) BUCKETS 2
properties(
    "dynamic_partition.enable" = "true",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.start" = "-50",
    "dynamic_partition.end" = "0", --- Dynamic Partition 不创建分区
    "dynamic_partition.time_unit" = "year",
    "replication_num" = "1"
);
```

这样我们同时具有了 Auto Partition 的灵活性，且分区名上保持了一致性。

## 分区管理

当启用自动分区后，分区名可以通过 `auto_partition_name` 函数映射到分区。`partitions` 表函数可以通过分区名产生详细的分区信息。仍然以 `DAILY_TRADE_VALUE` 表为例，在我们插入数据后，查看其当前分区：

```sql
mysql> select * from partitions("catalog"="internal","database"="optest","table"="DAILY_TRADE_VALUE") where PartitionName = auto_partition_name('range', 'year', '2008-02-03');
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName   | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
|      127095 | p20080101000000 |              2 | 2024-11-14 17:29:02 | NORMAL | TRADE_DATE   | [types: [DATEV2]; keys: [2008-01-01]; ..types: [DATEV2]; keys: [2009-01-01]; ) | TRADE_DATE      |      10 |              1 | HDD           | 9999-12-31 23:59:59 |                     | \N                       | 985.000 B |          0 | tag.location.default: 1 |         1 |                  1 | \N           |
+-------------+-----------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
1 row in set (0.18 sec)
```

这样每个分区的 ID 和取值就可以精准地被筛选出，用于后续针对分区的具体操作（例如 `insert overwrite partition`）。

详细语法说明请见：[auto_partition_name函数文档](../../sql-manual/sql-functions/string-functions/auto-partition-name)，[partitions表函数文档](../../sql-manual/sql-functions/table-valued-functions/partitions)。

## 注意事项

- 如同普通分区表一样，AUTO LIST PARTITION 支持多列分区，语法并无区别。
- 在数据的插入或导入过程中如果创建了分区，而整个导入过程没有完成（失败或被取消），被创建的分区不会被自动删除。
- 使用 AUTO PARTITION 的表，只是分区创建方式上由手动转为了自动。表及其所创建分区的原本使用方法都与非 AUTO PARTITION 的表或分区相同。
- 为防止意外创建过多分区，我们通过[FE 配置项](../../admin-manual/config/fe-config)中的`max_auto_partition_num`控制了一个 AUTO PARTITION 表最大容纳分区数。如有需要可以调整该值
- 向开启了 AUTO PARTITION 的表导入数据时，Coordinator 发送数据的轮询间隔与普通表有所不同。具体请见[BE 配置项](../../admin-manual/config/be-config)中的`olap_table_sink_send_interval_auto_partition_factor`。开启前移（`enable_memtable_on_sink_node = true`）后该变量不产生影响。
- 在使用[insert-overwrite](../../sql-manual/sql-statements/Data-Manipulation-Statements/Manipulation/INSERT-OVERWRITE)插入数据时 AUTO PARTITION 表的行为详见 INSERT OVERWRITE 文档。
- 如果导入创建分区时，该表涉及其他元数据操作（如 Schema Change、Rebalance），则导入可能失败。

## 关键词

AUTO, PARTITION, AUTO_PARTITION
