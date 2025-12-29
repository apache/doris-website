---
{
    "title": "聚合模型",
    "language": "zh-CN",
    "description": "Doris 的聚合模型专为高效处理大规模数据查询中的聚合操作设计。它通过预聚合数据，减少重复计算，提升查询性能。聚合模型只存储聚合后的数据，节省存储空间并加速查询。"
}
---

Doris 的聚合模型专为高效处理大规模数据查询中的聚合操作设计。它通过预聚合数据，减少重复计算，提升查询性能。聚合模型只存储聚合后的数据，节省存储空间并加速查询。

## 使用场景

* **明细数据进行汇总**：用于电商平台的月销售业绩、金融风控的客户交易总额、广告投放的点击量等业务场景中，进行多维度汇总；

* **不需要查询原始明细数据**：如驾驶舱报表、用户交易行为分析等，原始数据存储在数据湖中，仅需存储汇总后的数据。

## 原理

每一次数据导入会在聚合模型内形成一个版本，在 Compaction 阶段进行版本合并，在查询时会按照主键进行数据聚合：

1. **数据导入阶段**：数据按批次导入，每批次生成一个版本，并对相同聚合键的数据进行初步聚合（如求和、计数）；

2. **后台文件合并阶段（Compaction）**：多个版本文件会定期合并，减少冗余并优化存储；

3. **查询阶段**：查询时，系统会聚合同一聚合键的数据，确保查询结果准确。

## 建表说明

使用 AGGREGATE KEY 关键字在建表时指定聚合模型，并指定 Key 列用于聚合 Value 列。

```sql
CREATE TABLE IF NOT EXISTS example_tbl_agg
(
    user_id             LARGEINT    NOT NULL,
    load_dt             DATE        NOT NULL,
    city                VARCHAR(20),
    last_visit_dt       DATETIME    REPLACE DEFAULT "1970-01-01 00:00:00",
    cost                BIGINT      SUM DEFAULT "0",
    max_dwell           INT         MAX DEFAULT "0",
)
AGGREGATE KEY(user_id, load_dt, city)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

上例中定义了用户信息和访问行为表，将 `user_id`、`load_dt` 及 `city` 作为 Key 列进行聚合。数据导入时，Key 列会聚合成一行，Value 列会按照指定的聚合类型进行维度聚合。

在聚合表中支持以下类型的维度聚合：

| 聚合方式             | 描述                                                         |
|------------------|------------------------------------------------------------|
| SUM              | 求和，多行的 Value 进行累加。                                         |
| REPLACE          | 替代，下一批数据中的 Value 会替换之前导入过的行中的 Value。                     |
| MAX              | 保留最大值。                                                   |
| MIN              | 保留最小值。                                                   |
| REPLACE_IF_NOT_NULL | 非空值替换。与 REPLACE 的区别在于对 `null` 值，不做替换。                |
| HLL_UNION        | HLL 类型的列的聚合方式，通过 HyperLogLog 算法聚合。                       |
| BITMAP_UNION     | BITMAP 类型的列的聚合方式，进行位图的并集聚合。                          |

:::info 提示：

如果以上的聚合方式无法满足业务需求，可以选择使用 agg_state 类型。

:::

## 数据插入与存储

在聚合表中，数据基于主键进行聚合操作。数据插入后及完成聚合操作。

![aggrate-key-model-insert](/images/table-desigin/aggrate-key-model-insert.png)

在上例中，表中原有 4 行数据，在插入 2 行数据后，基于 Key 列进行维度列的聚合操作：

```sql
-- 4 rows raw data
INSERT INTO example_tbl_agg VALUES
(101, '2024-11-01', 'BJ', '2024-10-29', 10, 20),
(102, '2024-10-30', 'BJ', '2024-10-29', 20, 20),
(101, '2024-10-30', 'BJ', '2024-10-28', 5, 40),
(101, '2024-10-30', 'SH', '2024-10-29', 10, 20);

-- insert into 2 rows
INSERT INTO example_tbl_agg VALUES
(101, '2024-11-01', 'BJ', '2024-10-30', 20, 10),
(102, '2024-11-01', 'BJ', '2024-10-30', 10, 30);

-- check the rows of table
SELECT * FROM example_tbl_agg;
+---------+------------+------+---------------------+------+----------------+
| user_id | load_date  | city | last_visit_date     | cost | max_dwell_time |
+---------+------------+------+---------------------+------+----------------+
| 102     | 2024-10-30 | BJ   | 2024-10-29 00:00:00 |   20 |             20 |
| 102     | 2024-11-01 | BJ   | 2024-10-30 00:00:00 |   10 |             30 |
| 101     | 2024-10-30 | BJ   | 2024-10-28 00:00:00 |    5 |             40 |
| 101     | 2024-10-30 | SH   | 2024-10-29 00:00:00 |   10 |             20 |
| 101     | 2024-11-01 | BJ   | 2024-10-30 00:00:00 |   30 |             20 |
+---------+------------+------+---------------------+------+----------------+
```

## AGG_STATE

:::info 提示：

AGG_STATE 是实验特性，建议在开发与测试环境中使用。

:::

AGG_STATE 不能作为 Key 列使用，建表时需要同时声明聚合函数的签名。不需要指定长度和默认值。实际存储的数据大小与函数实现有关。

```sql
set enable_agg_state = true;
CREATE TABLE aggstate(
    k1   int  NULL,
    v1   int  SUM,
    v2   agg_state<group_concat(string)> generic
)
AGGREGATE KEY(k1)
DISTRIBUTED BY HASH(k1) BUCKETS 3;
```

在此示例中，`agg_state` 用于声明数据类型，`sum/group_concat` 为聚合函数签名。agg_state 是一种数据类型，类似于 int、array、string。agg_state 只能与 [state](../../sql-manual/sql-functions/combinators/state)、[merge](../../sql-manual/sql-functions/combinators/merge)[union](../../sql-manual/sql-functions/combinators/union) 函数组合器配合使用。它表示聚合函数的中间结果，例如 `group_concat` 的中间状态，而非最终结果。

agg_state 类型需要使用 state 函数来生成，对于当前的这个表，需要使用 `group_concat_state`：

```sql
insert into aggstate values(1, 1, group_concat_state('a'));
insert into aggstate values(1, 2, group_concat_state('b'));
insert into aggstate values(1, 3, group_concat_state('c'));
insert into aggstate values(2, 4, group_concat_state('d'));
```

此时表内计算方式如下图所示：

![state-func-group-concat-state-result-1](/images/table-desigin/state-func-group-concat-state-result-1.png)

在查询时，可以使用 [merge](../../sql-manual/sql-functions/combinators/merge/) 操作合并多个 state，并且返回最终聚合结果。因为 group_concat 对于顺序有要求，所以结果是不稳定的。

```sql
select group_concat_merge(v2) from aggstate;
+------------------------+
| group_concat_merge(v2) |
+------------------------+
| d,c,b,a                |
+------------------------+
```

如果不想要最终的聚合结果，而希望保留中间结果，可以使用 `union` 操作：

```sql
insert into aggstate select 3,sum_union(k2),group_concat_union(k3) from aggstate;
```

此时表中计算如下：

![state-func-group-concat-state-result-2](/images/table-desigin/state-func-group-concat-state-result-2.png)

查询结果如下：

```sql
mysql> select sum_merge(k2) , group_concat_merge(k3)from aggstate;
+---------------+------------------------+
| sum_merge(k2) | group_concat_merge(k3) |
+---------------+------------------------+
|            20 | c,b,a,d,c,b,a,d        |
+---------------+------------------------+

mysql> select sum_merge(k2) , group_concat_merge(k3)from aggstate where k1 != 2;
+---------------+------------------------+
| sum_merge(k2) | group_concat_merge(k3) |
+---------------+------------------------+
|            16 | c,b,a,d,c,b,a          |
+---------------+------------------------+
```

