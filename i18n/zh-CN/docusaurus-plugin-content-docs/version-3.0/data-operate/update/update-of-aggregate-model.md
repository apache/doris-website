---
{
    "title": "聚合模型的导入更新",
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

这篇文档主要介绍 Doris 聚合模型上基于导入的更新。

## 所有列更新

使用 Doris 支持的 Stream Load，Broker Load，Routine Load，Insert Into 等导入方式，往聚合模型（Agg 模型）中进行数据导入时，都会将新的值与旧的聚合值，根据列的聚合函数产出新的聚合值，这个值可能是插入时产出，也可能是异步 Compaction 时产出，但是用户查询时，都会得到一样的返回值。

## 聚合模型的部分列更新

Aggregate 表主要在预聚合场景使用而非数据更新的场景使用，但也可以通过将聚合函数设置为 REPLACE_IF_NOT_NULL 来实现部分列更新效果。

**建表**

将需要进行列更新的字段对应的聚合函数设置为`REPLACE_IF_NOT_NULL`

```sql
CREATE TABLE order_tbl (
  order_id int(11) NULL,
  order_amount int(11) REPLACE_IF_NOT_NULL NULL,
  order_status varchar(100) REPLACE_IF_NOT_NULL NULL
) ENGINE=OLAP
AGGREGATE KEY(order_id)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        |          100 | 待付款        |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

**数据写入**

无论是 Stream Load、Broker Load、Routine Load 还是`INSERT INTO`, 直接写入要更新的字段的数据即可

**示例**

与前面例子相同，对应的 Stream Load 命令为（不需要额外的 header）：

```shell
$ cat update.csv

1,To be shipped

curl  --location-trusted -u root: -H "column_separator:," -H "columns:order_id,order_status" -T /tmp/update.csv http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

对应的`INSERT INTO`语句为（不需要额外设置 session variable）：

```sql
INSERT INTO order_tbl (order_id, order_status) values (1,'待发货');
```

## 部分列更新使用注意

Aggregate Key 模型在写入过程中不做任何额外处理，所以写入性能不受影响，与普通的数据导入相同。但是在查询时进行聚合的代价较大，典型的聚合查询性能相比 Unique Key 模型的 Merge-on-Write 实现会有 5-10 倍的下降。

用户无法通过将某个字段由非 NULL 设置为 NULL，写入的 NULL 值在`REPLACE_IF_NOT_NULL`聚合函数的处理中会自动忽略。
