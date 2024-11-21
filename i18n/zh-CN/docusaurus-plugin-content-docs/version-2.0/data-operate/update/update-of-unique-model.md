---
{
    "title": "主键模型的导入更新",
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

这篇文档主要介绍 Doris 主键模型上基于导入的更新。

## 所有列更新

使用 Doris 支持的 Stream Load，Broker Load，Routine Load，Insert Into 等导入方式，往主键模型（Unique 模型）中进行数据导入时，如果没有相应主键的数据行，就执行插入新的数据，如果有相应主键的数据行，就进行更新。也就是说，Doris 主键模型的导入是一种“upsert”模式。基于导入，对已有记录的更新，默认和导入一个新记录是完全一样的，所以，这里可以参考数据导入的文档部分。

## 部分列更新

部分列更新，主要是指直接更新表中某些字段值，而不是全部的字段值。可以采用 Update 语句来进行更新，这种 Update 语句一般采用先将整行数据读出，然后再更新部分字段值，再写回。这种读写事务非常耗时，并且不适合大批量数据写入。Doris 在主键模型的导入更新，提供了可以直接插入或者更新部分列数据的功能，不需要先读取整行数据，这样更新效率就大幅提升了。

:::caution
注意

1. 2.0 版本仅在 Unique Key 的 Merge-on-Write 实现中支持了部分列更新能力
2. 从 2.0.2 版本开始，支持使用 INSERT INTO 进行部分列更新
3. 不支持在有同步物化视图的表上进行部分列更新
:::

### 适用场景

- 实时的动态列更新，需要在表中实时的高频更新某些字段值。例如用户标签表中有一些关于用户最新行为信息的字段需要实时的更新，以实现广告/推荐等系统能够据其进行实时的分析和决策。

- 将多张源表拼接成一张大宽表

- 数据修正

### 使用方式

**建表**

建表时需要指定如下 property，以开启 Merge-on-Write 实现

```Plain
enable_unique_key_merge_on_write = true
```

**StreamLoad/BrokerLoad/RoutineLoad**

如果使用的是 Stream Load/Broker Load/Routine Load，在导入时添加如下 header

```Plain
partial_columns:true
```

同时在`columns`中指定要导入的列（必须包含所有 key 列，不然无法更新）

**Flink Connector**

如果使用 Flink Connector, 需要添加如下配置：

```Plain
'sink.properties.partial_columns' = 'true',
```

同时在`sink.properties.column`中指定要导入的列（必须包含所有 key 列，不然无法更新）

**INSERT INTO**

在所有的数据模型中，`INSERT INTO` 给定一部分列时默认行为都是整行写入，为了防止误用，在 Merge-on-Write 实现中，`INSERT INTO`默认仍然保持整行 UPSERT 的语意，如果需要开启部分列更新的语意，需要设置如下 session variable

```Plain
set enable_unique_key_partial_update=true
```

需要注意的是，控制 insert 语句是否开启严格模式的会话变量`enable_insert_strict`的默认值为 true，即 insert 语句默认开启严格模式，而在严格模式下进行部分列更新不允许更新不存在的 key。所以，在使用 insert 语句进行部分列更新的时候如果希望能插入不存在的 key，需要在`enable_unique_key_partial_update`设置为 true 的基础上同时将`enable_insert_strict`设置为 false。

### 示例

假设 Doris 中存在一张订单表 order_tbl，其中订单 id 是 Key 列，订单状态，订单金额是 Value 列。数据状态如下：

| 订单 id | 订单金额 | 订单状态 |
| ------ | -------- | -------- |
| 1      | 100      | 待付款   |

```sql
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        |          100 | 待付款        |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

这时候，用户点击付款后，Doris 系统需要将订单 id 为 '1' 的订单状态变更为 '待发货'。

若使用 StreamLoad 可以通过如下方式进行更新：

```sql
$ cat update.csv

1,待发货

$ curl  --location-trusted -u root: -H "partial_columns:true" -H "column_separator:," -H "columns:order_id,order_status" -T /tmp/update.csv http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

若使用`INSRT INTO`可以通过如下方式进行更新：

```sql
set enable_unique_key_partial_update=true;
INSERT INTO order_tbl (order_id, order_status) values (1,'待发货');
```

更新后结果如下

```sql
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        |          100 | 待发货        |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

### 使用注意

由于 Merge-on-Write 实现需要在数据写入的时候，进行整行数据的补齐，以保证最优的查询性能，因此使用 Merge-on-Write 实现进行部分列更新会有部分导入性能下降。

写入性能优化建议：

- 使用配备了 NVMe 的 SSD，或者极速 SSD 云盘。因为补齐数据时会大量的读取历史数据，产生较高的读 IOPS，以及读吞吐

- 开启行存将能够大大减少补齐数据时产生的 IOPS，导入性能提升明显，用户可以在建表时通过如下 property 来开启行存：

```Plain
"store_row_column" = "true"
```

目前，同一批次数据写入任务（无论是导入任务还是`INSERT INTO`）的所有行只能更新相同的列，如果需要更新不同列的数据，则需要分不同的批次进行写入。

在未来版本中，将支持灵活的列更新，用户可以在同一批导入中，每一行更新不同的列。
