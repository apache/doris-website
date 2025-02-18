---
{
    "title": "聚合模型",
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

Doris 的聚合模型是为了高效地处理大规模数据查询中的聚合操作而设计的。聚合模型通过对数据进行预聚合操作，减少了计算的重复性，提升了查询性能。聚合模型支持常见的聚合函数，可以在不同粒度上执行聚合操作。在聚合模型中，只存储聚合后的数据，不存储原始数据，减少了存储空间并提升了查询性能。

## 使用场景

* 对于明细数据进行汇总：如电商平台需要评估月销售总业绩、金融风控需要查询客户交易总额、广告投放需要分析广告总点击量等业务场景中，针对明细数据进行多维度的汇总操作；

* 不需要查询原始明细数据：如驾驶舱报表、用户交易行为分析等业务，原始数据存储在数据湖中，在入库时不需要保留原始数据，只需要存储汇总后的数据；

## 原理

每一次数据导入会在聚合模型内形成一个版本，在 Compaction 阶段进行版本合并，在查询时会按照主键进行数据聚合：

* 数据导入阶段

  * 数据按批次导入到聚合表，每个批次形成一个版本。

  * 在每个版本中，对相同聚合键的数据进行初步聚合（如求和、计数等）。

* 后台文件合并阶段（Compaction）

  * 多个批次生成多个版本文件，定期合并成一个大版本文件。

  * 合并过程中，同一聚合键的数据会再次聚合，以减少冗余并优化存储。

* 查询阶段

  * 查询时，系统会从所有版本中聚合同一聚合键的数据，确保结果准确。

  * 通过聚合多个版本的数据，返回最终的查询结果。

## 建表说明

在建表时，可以通过 AGGREGATE KEY 关键字指定聚合模型。聚合模型必须指定 Key 列，用于在存储时按照 Key 列进行 Value 列的聚合操作。

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

上例中定义了用户信息和访问的行为事实表，将 `user_id`、`load_date`、`city` 及 `age` 作为 Key 列进行聚合操作。数据导入时，Key 列会聚合成一行，Value 列会按照指定的聚合类型进行维度聚合。在聚合表中支持一下类型的维度聚合：

* SUM：求和，多行的 Value 进行累加。

* REPLACE：替代，下一批数据中的 Value 会替换之前导入过的行中的 Value。

* MAX：保留最大值。

* MIN：保留最小值。

* REPLACE_IF_NOT_NULL：非空值替换。和 REPLACE 的区别在于对于 null 值，不做替换。

* HLL_UNION：HLL 类型的列的聚合方式，通过 HyperLogLog 算法聚合。

* BITMAP_UNION：BIMTAP 类型的列的聚合方式，进行位图的并集聚合。

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

AGG_STATE 不能作为 Key 列使用，建表时需要同时声明聚合函数的签名。用户不需要指定长度和默认值。实际存储的数据大小与函数实现有关。

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

其中 agg_state 用于声明数据类型为 agg_state，sum/group_concat 为聚合函数的签名。注意 agg_state 是一种数据类型，同 int/array/string 一样。agg_state 只能配合 [state](../../sql-manual/sql-functions/combinators/state)/[merge](../../sql-manual/sql-functions/combinators/merge)/[union](../../sql-manual/sql-functions/combinators/union) 函数组合器使用。agg_state 是聚合函数的中间结果，例如，聚合函数 group_concat，则 agg_state 可以表示 group_concat('a', 'b', 'c') 的这个中间状态，而不是最终的结果。

agg_state 类型需要使用 state 函数来生成，对于当前的这个表，需要使用 `group_concat_state`：

```sql
insert into aggstate values(1, 1, group_concat_state('a'));
insert into aggstate values(1, 2, group_concat_state('b'));
insert into aggstate values(1, 3, group_concat_state('c'));
insert into aggstate values(2, 4, group_concat_state('d'));
```

此时表内计算方式如下图所示：

![state-func-group-concat-state-result-1](/images/table-desigin/state-func-group-concat-state-result-1.png)

在查询表是，可以使用 [merge](../../sql-manual/sql-functions/combinators/merge/) 操作合并多个 state，并且返回最终聚合结果。因为 group_concat 对于顺序有要求，所以结果是不稳定的。

```sql
select group_concat_merge(v2) from aggstate;
+------------------------+
| group_concat_merge(v2) |
+------------------------+
| d,c,b,a                |
+------------------------+
```

如果不想要聚合的最终结果，可以使用 union 来合并多个聚合的中间结果，生成一个新的中间结果。

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

