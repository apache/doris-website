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


## 灵活部分列更新

在 x.x.x 版本之前，doris 支持的部分列更新功能限制了一次导入中每一行必须更新相同的列，从 x.x.x 版本开始，doris 支持一种更加灵活的更新方式，它使得一次导入中的每一行可以更新不同的列。

:::caution
注意

1. 灵活列更新这一功能从 x.x.x 版本开始支持
2. 目前只有 stream load 这一种导入方式以及使用 stream load 作为其导入方式的工具(如 doris-flink-connector)支持灵活列更新功能
3. 在使用灵活列更新时导入文件必须为 json 格式的数据
:::

### 适用场景

在使用 CDC 的方式将某个数据系统的数据实时同步到 Doris 中时，源端系统输出的记录可能并不是完整的行数据，而是只有主键和被更新的列的数据。在这种情况下，某个时间窗口内的一批数据中每一行更新的列可能都是不同的。此时，可以使用灵活列更新的方式来将数据导入到 Doris 中。

### 使用方式

**存量表开启灵活列更新功能**

对于在旧版本 Doris 中已经建好的存量 Merge-On-Write 表，在升级 Doris 之后如果想要使用灵活列更新的功能，可以使用 `ALTER TALBE db1.tbl1 ENABLE FEATURE "UPDATE_FLEXIBLE_COLUMNS";` 来开启这一功能。执行完上述语句后使用 `show create table db1.tbl1` 的结果中如果包含 `"enable_unique_key_skip_bitmap_column" = "true"` 则表示功能开启成功。注意，使用这一方式之前需要确保目标表已经开启了 light-schema-change 的功能。

**新建表使用灵活列更新功能**

对于新建的表，如果需要使用灵活列更新功能，建表时需要指定如下表属性，以开启 Merge-on-Write 实现，开启 light-schema-change，同时使得表具有灵活列更新所需要的 `bitmap` 隐藏列。

```Plain
"enable_light_schema_change" = "true"
"enable_unique_key_merge_on_write" = "true"
"enable_unique_key_skip_bitmap_column" = "true"
```

**StreamLoad**

在使用 Stream Load 导入时添加如下 header

```Plain
unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS
```

**Flink Doris Connector**

如果使用 Flink Doris Connector, 需要添加如下配置：

```Plain
'sink.properties.unique_key_update_mode' = 'UPDATE_FLEXIBLE_COLUMNS'
```

### 示例

假设有如下表

```sql
CREATE TABLE t1 (
  `k` int(11) NULL, 
  `v1` BIGINT NULL,
  `v2` BIGINT NULL DEFAULT "9876",
  `v3` BIGINT NOT NULL,
  `v4` BIGINT NOT NULL DEFAULT "1234",
  `v5` BIGINT NULL
) UNIQUE KEY(`k`) DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES(
"replication_num" = "3",
"enable_unique_key_merge_on_write" = "true",
"enable_light_schema_change" = "true",
"enable_unique_key_skip_bitmap_column" = "true");
```

表中有如下原始数据

```sql
MySQL root@127.1:d1> select * from t1;
+---+----+----+----+----+----+
| k | v1 | v2 | v3 | v4 | v5 |
+---+----+----+----+----+----+
| 0 | 0  | 0  | 0  | 0  | 0  |
| 1 | 1  | 1  | 1  | 1  | 1  |
| 2 | 2  | 2  | 2  | 2  | 2  |
| 3 | 3  | 3  | 3  | 3  | 3  |
| 4 | 4  | 4  | 4  | 4  | 4  |
| 5 | 5  | 5  | 5  | 5  | 5  |
+---+----+----+----+----+----+
```

现在通过灵活列更新导入来更新其中的一些行的字段

```shell
$ cat test1.json
```
```json
{"k": 0, "__DORIS_DELETE_SIGN__": 1}
{"k": 1, "v1": 10}
{"k": 2, "v2": 20, "v5": 25}
{"k": 3, "v3": 30}
{"k": 4, "v4": 20, "v1": 43, "v3": 99}
{"k": 5, "v5": null}
{"k": 6, "v1": 999, "v3": 777}
{"k": 2, "v4": 222}
{"k": 1, "v2": 111, "v3": 111}
```
```shell
curl --location-trusted -u root: \
-H "strict_mode:false" \
-H "format:json" \
-H "read_json_by_line:true" \
-H "unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS" \
-T test1.json \
-XPUT http://<host>:<http_port>/api/d1/t1/_stream_load
```

更新后表中的数据如下：

```sql
MySQL root@127.1:d1> select * from t1;
+---+-----+------+-----+------+--------+
| k | v1  | v2   | v3  | v4   | v5     |
+---+-----+------+-----+------+--------+
| 1 | 10  | 111  | 111 | 1    | 1      |
| 2 | 2   | 20   | 2   | 222  | 25     |
| 3 | 3   | 3    | 30  | 3    | 3      |
| 4 | 43  | 4    | 99  | 20   | 4      |
| 5 | 5   | 5    | 5   | 5    | <null> |
| 6 | 999 | 9876 | 777 | 1234 | <null> |
+---+-----+------+-----+------+--------+
```

### 限制与注意事项

1. 和之前的部分列更新相同，灵活列更新要求导入的每一行数据需要包括所有的 Key 列，不满足这一要求的行数据将被过滤掉，同时计入 `filter rows` 的计数中，如果 `filtered rows` 的数量超过了本次导入 `max_filter_ratio` 所能容忍的上限，则整个导入将会失败。同时，被过滤的数据会在 error log 留下一条日志。

2. 灵活列更新导入中每一个 json 对象中的键值对只有当它的 Key 和目标表中某一列的列名一致时才是有效的，不满足这一要求的键值对将被忽略 。同时，Key 为 `__DORIS_VERSION_COL__`/`__DORIS_ROW_STORE_COL__`/`__DORIS_SKIP_BITMAP_COL__` 的键值对也将被忽略。

3. 当目标表的表属性中设置了 `function_column.sequence_type` 这一属性时，灵活列更新的导入可以通过在 json 对象中包括 Key 为 `__DORIS_SEQUENCE_COL__` 的键值对来指定目标表中 `__DORIS_SEQUENCE_COL__` 列的值。对于不指定 `__DORIS_SEQUENCE_COL__` 列的值的行，如果这一行的 Key 在原表中存在，则这一行 `__DORIS_SEQUENCE_COL__` 列的值将被填充为旧行中对应的值，否则该列的值将被填充为 `null` 值

例如，对于下表：
```sql
CREATE TABLE t2 (
  `k` int(11) NULL, 
  `v1` BIGINT NULL,
  `v2` BIGINT NULL DEFAULT "9876",
  `v3` BIGINT NOT NULL,
  `v4` BIGINT NOT NULL DEFAULT "1234",
  `v5` BIGINT NULL
) UNIQUE KEY(`k`) DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES(
"replication_num" = "3",
"enable_unique_key_merge_on_write" = "true",
"enable_light_schema_change" = "true",
"enable_unique_key_skip_bitmap_column" = "true",
"function_column.sequence_type" = "int");
```

表中有如下原始数据：
```sql
+---+----+----+----+----+----+----------------------+
| k | v1 | v2 | v3 | v4 | v5 |__DORIS_SEQUENCE_COL__|
+---+----+----+----+----+----+----------------------+
| 0 | 0  | 0  | 0  | 0  | 0  | 0                    |
| 1 | 1  | 1  | 1  | 1  | 10 | 10                   |
| 2 | 2  | 2  | 2  | 2  | 20 | 20                   |
| 3 | 3  | 3  | 3  | 3  | 30 | 30                   |
| 4 | 4  | 4  | 4  | 4  | 40 | 40                   |
| 5 | 5  | 5  | 5  | 5  | 50 | 50                   |
+---+----+----+----+----+----+----------------------+
```

通过灵活列更新导入如下数据：
```json
{"k": 1, "v1": 111, "v5": 9, "__DORIS_SEQUENCE_COL__": 9}
{"k": 2, "v2": 222, "v5": 25, "__DORIS_SEQUENCE_COL__": 25}
{"k": 3, "v3": 333}
{"k": 4, "v4": 444, "v5": 50, "v1": 411, "v3": 433, "v2": null, "__DORIS_SEQUENCE_COL__": 50}
{"k": 5, "v5": null, "__DORIS_SEQUENCE_COL__": null}
{"k": 6, "v1": 611, "v3": 633}
{"k": 7, "v3": 733, "v5": 300, "__DORIS_SEQUENCE_COL__": 300}
```

最终表中的数据如下：
```sql
+---+--------+--------+-----+------+--------+
| k | v1     | v2     | v3  | v4   | v5     |
+---+--------+--------+-----+------+--------+
| 0 | 0      | 0      | 0   | 0    | 0      |
| 1 | 1      | 1      | 1   | 1    | 1      |
| 5 | 5      | 5      | 5   | 5    | 5      |
| 2 | 2      | 222    | 2   | 2    | 25     |
| 3 | 3      | 3      | 333 | 3    | 3      |
| 4 | 411    | <null> | 433 | 444  | 50     |
| 6 | 611    | 9876   | 633 | 1234 | <null> |
| 7 | <null> | 9876   | 733 | 1234 | 300    |
+---+--------+--------+-----+------+--------+
```

4. 当目标表的表属性中设置了 `function_column.sequence_col` 这一属性时，灵活列更新导入数据的 json 对象中 Key 为 `__DORIS_SEQUENCE_COL__` 的键值对将被忽略，导入中某一行 `__DORIS_SEQUENCE_COL__` 列的值将与这一行中表属性 `function_column.sequence_col` 所指定的列最终的值完全一致。

例如，对于下表：
```sql
CREATE TABLE t3 (
  `k` int(11) NULL, 
  `v1` BIGINT NULL,
  `v2` BIGINT NULL DEFAULT "9876",
  `v3` BIGINT NOT NULL,
  `v4` BIGINT NOT NULL DEFAULT "1234",
  `v5` BIGINT NULL DEFAULT "31"
) UNIQUE KEY(`k`) DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES(
"replication_num" = "3",
"enable_unique_key_merge_on_write" = "true",
"enable_light_schema_change" = "true",
"enable_unique_key_skip_bitmap_column" = "true",
"function_column.sequence_col" = "v5");
```

表中有如下原始数据：
```sql
+---+----+----+----+----+----+----------------------+
| k | v1 | v2 | v3 | v4 | v5 |__DORIS_SEQUENCE_COL__|
+---+----+----+----+----+----+----------------------+
| 0 | 0  | 0  | 0  | 0  | 0  | 0                    |
| 1 | 1  | 1  | 1  | 1  | 10 | 10                   |
| 2 | 2  | 2  | 2  | 2  | 20 | 20                   |
| 3 | 3  | 3  | 3  | 3  | 30 | 30                   |
| 4 | 4  | 4  | 4  | 4  | 40 | 40                   |
| 5 | 5  | 5  | 5  | 5  | 50 | 50                   |
+---+----+----+----+----+----+----------------------+
```

通过灵活列更新导入如下数据：
```json
{"k": 1, "v1": 111, "v5": 9}
{"k": 2, "v2": 222, "v5": 25}
{"k": 3, "v3": 333}
{"k": 4, "v4": 444, "v5": 50, "v1": 411, "v3": 433, "v2": null}
{"k": 5, "v5": null}
{"k": 6, "v1": 611, "v3": 633}
{"k": 7, "v3": 733, "v5": 300}
```

最终表中的数据如下：
```sql
+---+--------+--------+-----+------+-----+
| k | v1     | v2     | v3  | v4   | v5  |
+---+--------+--------+-----+------+-----+
| 0 | 0      | 0      | 0   | 0    | 0   |
| 1 | 1      | 1      | 1   | 1    | 10  |
| 5 | 5      | 5      | 5   | 5    | 50  |
| 2 | 2      | 222    | 2   | 2    | 25  |
| 3 | 3      | 3      | 333 | 3    | 30  |
| 4 | 411    | <null> | 433 | 444  | 50  |
| 6 | 611    | 9876   | 633 | 1234 | 31  |
| 7 | <null> | 9876   | 733 | 1234 | 300 |
+---+--------+--------+-----+------+-----+
```

5. 使用灵活列更新时不能指定或开启如下一些导入属参数：
    - 不能指定 `merge_type` 参数
    - 不能指定 `delete` 参数
    - 不能开启 `fuzzy_parse` 参数
    - 不能指定 `columns` 参数
    - 不能指定 `jsonpaths` 参数
    - 不能指定 `hidden_columns` 参数
    - 不能指定 `function_column.sequence_col` 参数
    - 不能指定 `sql` 参数
    - 不能开启 `memtable_on_sink_node` 前移
    - 不能指定 `group_commit` 参数
    - 不能指定 `where` 参数

6. 不支持在有 Variant 列的表上进行灵活列更新。

7. 不支持在有同步物化视图的表上进行灵活列更新。
