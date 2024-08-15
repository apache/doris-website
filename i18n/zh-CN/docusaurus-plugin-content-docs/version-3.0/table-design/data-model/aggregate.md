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

聚合数据模型，也称为 Aggregate 数据模型。

下面以实际的例子来说明什么是聚合模型，以及如何正确的使用聚合模型。

## 导入数据聚合

假设业务有如下数据表模式：

| ColumnName      | Type        | AggregationType | Comment              |
| --------------- | ----------- | --------------- | -------------------- |
| user_id         | LARGEINT    |                 | 用户 id               |
| date            | DATE        |                 | 数据灌入日期         |
| city            | VARCHAR(20) |                 | 用户所在城市         |
| age             | SMALLINT    |                 | 用户年龄             |
| sex             | TINYINT     |                 | 用户性别             |
| last_visit_date | DATETIME    | REPLACE         | 用户最后一次访问时间 |
| cost            | BIGINT      | SUM             | 用户总消费           |
| max_dwell_time  | INT         | MAX             | 用户最大停留时间     |
| min_dwell_time  | INT         | MIN             | 用户最小停留时间     |

如果转换成建表语句则如下（省略建表语句中的 Partition 和 Distribution 信息）

```sql
CREATE TABLE IF NOT EXISTS example_tbl_agg1
(
    `user_id` LARGEINT NOT NULL COMMENT "用户id",
    `date` DATE NOT NULL COMMENT "数据灌入日期时间",
    `city` VARCHAR(20) COMMENT "用户所在城市",
    `age` SMALLINT COMMENT "用户年龄",
    `sex` TINYINT COMMENT "用户性别",
    `last_visit_date` DATETIME REPLACE DEFAULT "1970-01-01 00:00:00" COMMENT "用户最后一次访问时间",
    `cost` BIGINT SUM DEFAULT "0" COMMENT "用户总消费",
    `max_dwell_time` INT MAX DEFAULT "0" COMMENT "用户最大停留时间",
    `min_dwell_time` INT MIN DEFAULT "99999" COMMENT "用户最小停留时间"
)
AGGREGATE KEY(`user_id`, `date`, `city`, `age`, `sex`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

这是一个典型的用户信息和访问行为的事实表。在一般星型模型中，用户信息和访问行为一般分别存放在维度表和事实表中。这里为了更加方便的解释 Doris 的数据模型，将两部分信息统一存放在一张表中。

表中的列按照是否设置了 AggregationType，分为 Key (维度列) 和 Value（指标列）。没有设置 AggregationType 的 user_id、date、age、sex 称为 Key，而设置了 AggregationType 的称为 Value。

当导入数据时，对于 Key 列相同的行会聚合成一行，而 Value 列会按照设置的 AggregationType 进行聚合。AggregationType 目前有以下几种聚合方式和 agg_state：

-   SUM：求和，多行的 Value 进行累加。

-   REPLACE：替代，下一批数据中的 Value 会替换之前导入过的行中的 Value。

-   MAX：保留最大值。

-   MIN：保留最小值。

-   REPLACE_IF_NOT_NULL：非空值替换。和 REPLACE 的区别在于对于 null 值，不做替换。

-   HLL_UNION：HLL 类型的列的聚合方式，通过 HyperLogLog 算法聚合。

-   BITMAP_UNION：BIMTAP 类型的列的聚合方式，进行位图的并集聚合。

:::caution
如果这几种聚合方式无法满足需求，则可以选择使用 agg_state 类型。
:::

假设有以下导入数据（原始数据）：

| user_id | date      | city | age  | sex  | last_visit_date | cost | max_dwell_time | min_dwell_time |
| ------- | --------- | ---- | ---- | ---- | --------------- | ---- | -------------- | -------------- |
| 10000   | 2017/10/1 | 北京 | 20   | 0    | 2017/10/1 6:00  | 20   | 10             | 10             |
| 10000   | 2017/10/1 | 北京 | 20   | 0    | 2017/10/1 7:00  | 15   | 2              | 2              |
| 10001   | 2017/10/1 | 北京 | 30   | 1    | 2017/10/1 17:05 | 2    | 22             | 22             |
| 10002   | 2017/10/2 | 上海 | 20   | 1    | 2017/10/2 12:59 | 200  | 5              | 5              |
| 10003   | 2017/10/2 | 广州 | 32   | 0    | 2017/10/2 11:20 | 30   | 11             | 11             |
| 10004   | 2017/10/1 | 深圳 | 35   | 0    | 2017/10/1 10:00 | 100  | 3              | 3              |
| 10004   | 2017/10/3 | 深圳 | 35   | 0    | 2017/10/3 10:20 | 11   | 6              | 6              |

通过 SQL 导入数据：

```sql
insert into example_tbl_agg1 values
(10000,"2017-10-01","北京",20,0,"2017-10-01 06:00:00",20,10,10),
(10000,"2017-10-01","北京",20,0,"2017-10-01 07:00:00",15,2,2),
(10001,"2017-10-01","北京",30,1,"2017-10-01 17:05:45",2,22,22),
(10002,"2017-10-02","上海",20,1,"2017-10-02 12:59:12",200,5,5),
(10003,"2017-10-02","广州",32,0,"2017-10-02 11:20:00",30,11,11),
(10004,"2017-10-01","深圳",35,0,"2017-10-01 10:00:15",100,3,3),
(10004,"2017-10-03","深圳",35,0,"2017-10-03 10:20:22",11,6,6);
```

这是一张记录用户访问某商品页面行为的表。以第一行数据为例，解释如下：

| 数据           | 说明                                   |
| -------------- | -------------------------------------- |
| 10000          | 用户 id，每个用户唯一识别 id             |
| 2017/10/1      | 数据入库时间，精确到日期               |
| 北京           | 用户所在城市                           |
| 20             | 用户年龄                               |
| 0              | 性别男（1 代表女性）                   |
| 2017/10/1 6:00 | 用户本次访问该页面的时间，精确到秒     |
| 20             | 用户本次访问产生的消费                 |
| 10             | 用户本次访问，驻留该页面的时间         |
| 10             | 用户本次访问，驻留该页面的时间（冗余） |

那么当这批数据正确导入到 Doris 中后，Doris 中最终存储如下：

| user_id | date      | city | age  | sex  | last_visit_date | cost | max_dwell_time | min_dwell_time |
| ------- | --------- | ---- | ---- | ---- | --------------- | ---- | -------------- | -------------- |
| 10000   | 2017/10/1 | 北京 | 20   | 0    | 2017/10/1 7:00  | 35   | 10             | 2              |
| 10001   | 2017/10/1 | 北京 | 30   | 1    | 2017/10/1 17:05 | 2    | 22             | 22             |
| 10002   | 2017/10/2 | 上海 | 20   | 1    | 2017/10/2 12:59 | 200  | 5              | 5              |
| 10003   | 2017/10/2 | 广州 | 32   | 0    | 2017/10/2 11:20 | 30   | 11             | 11             |
| 10004   | 2017/10/1 | 深圳 | 35   | 0    | 2017/10/1 10:00 | 100  | 3              | 3              |
| 10004   | 2017/10/3 | 深圳 | 35   | 0    | 2017/10/3 10:20 | 11   | 6              | 6              |

可以看到，用户 10000 只剩下了一行聚合后的数据。而其余用户的数据和原始数据保持一致。对于用户 10000 聚合后的数据，前 5 列没有变化：

-   第 6 列值为 2017-10-01 07:00:00。因为 last_visit_date 列的聚合方式为 REPLACE，所以 2017-10-01 07:00:00 替换了 2017-10-01 06:00:00 保存了下来。注意：在同一个导入批次中的数据，对于 REPLACE 这种聚合方式，替换顺序不做保证，如在这个例子中，最终保存下来的，也有可能是 2017-10-01 06:00:00；而对于不同导入批次中的数据，可以保证，后一批次的数据会替换前一批次。

-   第 7 列值为 35：因为 cost 列的聚合类型为 SUM，所以由 20 + 15 累加获得 35。

-   第 8 列值为 10：因为 max_dwell_time 列的聚合类型为 MAX，所以 10 和 2 取最大值，获得 10。

-   第 9 列值为 2：因为 min_dwell_time 列的聚合类型为 MIN，所以 10 和 2 取最小值，获得 2。

经过聚合，Doris 中最终只会存储聚合后的数据。换句话说，即明细数据会丢失，用户不能够再查询到聚合前的明细数据了。

## 导入数据与已有数据聚合

假设现在表中已经拥有了前面导入的数据：

| user_id | date      | city | age  | sex  | last_visit_date | cost | max_dwell_time | min_dwell_time |
| ------- | --------- | ---- | ---- | ---- | --------------- | ---- | -------------- | -------------- |
| 10000   | 2017/10/1 | 北京 | 20   | 0    | 2017/10/1 7:00  | 35   | 10             | 2              |
| 10001   | 2017/10/1 | 北京 | 30   | 1    | 2017/10/1 17:05 | 2    | 22             | 22             |
| 10002   | 2017/10/2 | 上海 | 20   | 1    | 2017/10/2 12:59 | 200  | 5              | 5              |
| 10003   | 2017/10/2 | 广州 | 32   | 0    | 2017/10/2 11:20 | 30   | 11             | 11             |
| 10004   | 2017/10/1 | 深圳 | 35   | 0    | 2017/10/1 10:00 | 100  | 3              | 3              |
| 10004   | 2017/10/3 | 深圳 | 35   | 0    | 2017/10/3 10:20 | 11   | 6              | 6              |

再导入一批新的数据：

| user_id | date      | city | age  | sex  | last_visit_date | cost | max_dwell_time | min_dwell_time |
| ------- | --------- | ---- | ---- | ---- | --------------- | ---- | -------------- | -------------- |
| 10004   | 2017/10/3 | 深圳 | 35   | 0    | 2017/10/3 11:22 | 44   | 19             | 19             |
| 10005   | 2017/10/3 | 长沙 | 29   | 1    | 2017/10/3 18:11 | 3    | 1              | 1              |

通过 SQL 导入数据：

```sql
insert into example_tbl_agg1 values
(10004,"2017-10-03","深圳",35,0,"2017-10-03 11:22:00",44,19,19),
(10005,"2017-10-03","长沙",29,1,"2017-10-03 18:11:02",3,1,1);
```

那么当这批数据正确导入到 Doris 中后，Doris 中最终存储如下：

| user_id | date      | city  | age  | sex  | last_visit_date | cost | max_dwell_time | min_dwell_time |
| ------- | --------- | ------------- | ---- | ---- | --------------- | ---- | -------------- | -------------- |
| 10000   | 2017/10/1 |    北京 | 20   | 0    | 2017/10/1 7:00  | 35   | 10             | 2              |
| 10001   | 2017/10/1 |    北京 | 30   | 1    | 2017/10/1 17:05 | 2    | 22             | 22             |
| 10002   | 2017/10/2 |    上海 | 20   | 1    | 2017/10/2 12:59 | 200  | 5              | 5              |
| 10003   | 2017/10/2 | 广州 | 32   | 0    | 2017/10/2 11:20 | 30   | 11             | 11             |
| 10004   | 2017/10/1 | 深圳 | 35   | 0    | 2017/10/1 10:00 | 100  | 3              | 3              |
| 10004   | 2017/10/3 | 深圳  | 35   | 0    | 2017/10/3 11:22 | 55   | 19             | 6              |
| 10005   | 2017/10/3 | 长沙  | 29   | 1    | 2017/10/3 18:11 | 3    | 1              | 1              |

可以看到，用户 10004 的已有数据和新导入的数据发生了聚合。同时新增了 10005 用户的数据。

数据的聚合，在 Doris 中有如下三个阶段发生：

1.  每一批次数据导入的 ETL 阶段。该阶段会在每一批次导入的数据内部进行聚合。

2.  底层 BE 进行数据 Compaction 的阶段。该阶段，BE 会对已导入的不同批次的数据进行进一步的聚合。

3.  数据查询阶段。在数据查询时，对于查询涉及到的数据，会进行对应的聚合。

数据在不同时间，可能聚合的程度不一致。比如一批数据刚导入时，可能还未与之前已存在的数据进行聚合。但是对于用户而言，用户只能查询到聚合后的数据。即不同的聚合程度对于用户查询而言是透明的。用户需始终认为数据以最终的完成的聚合程度存在，而不应假设某些聚合还未发生。（可参阅聚合模型的局限性一节获得更多详情。）

## agg_state

```Plain
AGG_STATE不能作为key列使用，建表时需要同时声明聚合函数的签名。
用户不需要指定长度和默认值。实际存储的数据大小与函数实现有关。
```

建表

```sql
set enable_agg_state=true;
create table aggstate(
    k1 int null,
   	k2 agg_state<sum(int)> generic,
    k3 agg_state<group_concat(string)> generic
)
aggregate key (k1)
distributed BY hash(k1) buckets 3
properties("replication_num" = "1");
```

其中 agg_state 用于声明数据类型为 agg_state，sum/group_concat 为聚合函数的签名。注意 agg_state 是一种数据类型，同 int/array/string

agg_state 只能配合[state](../../sql-manual/sql-functions/combinators/state) /[merge](../../sql-manual/sql-functions/combinators/merge)/[union](../../sql-manual/sql-functions/combinators/union)函数组合器使用。

agg_state 是聚合函数的中间结果，例如，聚合函数 sum，则 agg_state 可以表示 sum(1,2,3,4,5) 的这个中间状态，而不是最终的结果。

agg_state 类型需要使用 state 函数来生成，对于当前的这个表，则为`sum_state`,`group_concat_state`。

```sql
insert into aggstate values(1,sum_state(1),group_concat_state('a'));
insert into aggstate values(1,sum_state(2),group_concat_state('b'));
insert into aggstate values(1,sum_state(3),group_concat_state('c'));
```

此时表只有一行 ( 注意，下面的表只是示意图，不是真的可以 select 显示出来)

| k1   | k2         | k3                        |
| ---- | ---------- | ------------------------- |
| 1    | sum(1,2,3) | group_concat_state(a,b,c) |

再插入一条数据

```sql
insert into aggstate values(2,sum_state(4),group_concat_state('d'));
```

此时表的结构为

| k1   | k2         | k3                        |
| ---- | ---------- | ------------------------- |
| 1    | sum(1,2,3) | group_concat_state(a,b,c) |
| 2    | sum(4)     | group_concat_state(d)     |

我们可以通过 merge 操作来合并多个 state，并且返回最终聚合函数计算的结果

```Plain
mysql> select sum_merge(k2) from aggstate;
+---------------+
| sum_merge(k2) |
+---------------+
|            10 |
+---------------+
```

`sum_merge` 会先把 sum(1,2,3) 和 sum(4) 合并成 sum(1,2,3,4) ，并返回计算的结果。因为 group_concat 对于顺序有要求，所以结果是不稳定的。

```Plain
mysql> select group_concat_merge(k3) from aggstate;
+------------------------+
| group_concat_merge(k3) |
+------------------------+
| c,b,a,d                |
+------------------------+
```

如果不想要聚合的最终结果，可以使用 union 来合并多个聚合的中间结果，生成一个新的中间结果。

```sql
insert into aggstate select 3,sum_union(k2),group_concat_union(k3) from aggstate ;
```

此时的表结构为

| k1   | k2           | k3                          |
| ---- | ------------ | --------------------------- |
| 1    | sum(1,2,3)   | group_concat_state(a,b,c)   |
| 2    | sum(4)       | group_concat_state(d)       |
| 3    | sum(1,2,3,4) | group_concat_state(a,b,c,d) |

可以通过查询

```Plain
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

用户可以通过 agg_state 做出更细致的聚合函数操作。

注意 agg_state 存在一定的性能开销。