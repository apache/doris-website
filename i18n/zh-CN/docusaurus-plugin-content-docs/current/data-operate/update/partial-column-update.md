---
{
    "title": "列更新",
    "language": "zh-CN",
    "description": "这篇文档介绍如何在 Doris 中对主键模型和聚合模型表进行列更新。"
}
---

部分列更新允许您更新表中的特定字段，而不需要修改所有字段。这篇文档介绍如何对主键模型（Unique Key Model）和聚合模型（Aggregate Key Model）表进行部分列更新。

## 概述

部分列更新是指直接更新表中某些字段值，而不是全部字段值。可以使用 Update 语句进行更新，这种 Update 语句通常先读取整行数据，然后更新部分字段值，再写回。这种读写事务非常耗时，不适合大批量数据写入。Doris 在主键模型的导入更新中，提供了直接插入或更新部分列数据的功能，不需要先读取整行数据，从而大幅提升更新效率。

部分列更新特别适用于：

- 实时动态列更新，需要在表中实时高频更新某些字段值。例如用户标签表中有一些关于用户最新行为信息的字段需要实时更新，以便广告/推荐系统能够据此进行实时分析和决策。
- 将多张源表拼接成一张大宽表。
- 数据修正。

## 主键模型的列更新

Doris 在主键模型的导入更新中，提供了直接插入或更新部分列数据的功能，不需要先读取整行数据，从而大幅提升更新效率。

:::caution 注意

1. 2.0 版本仅在 Unique Key 的 Merge-on-Write 实现中支持部分列更新能力。
2. 从 2.0.2 版本开始，支持使用 INSERT INTO 进行部分列更新。
3. 不支持在有同步物化视图的表上进行部分列更新。
4. 不支持在进行 Schema Change 的表上进行部分列更新。
:::

### 使用示例

假设 Doris 中存在一张订单表 `order_tbl`，其中订单 id 是 Key 列，订单状态和订单金额是 Value 列。数据状态如下：

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

此时，用户点击付款后，Doris 系统需要将订单 id 为 '1' 的订单状态变更为 '待发货'。

### 使用导入方式进行部分列更新

#### StreamLoad/BrokerLoad/RoutineLoad

准备如下 csv 文件：

```
1,待发货
```

在导入时添加如下 header：

```sql
partial_columns:true
```

同时在 `columns` 中指定要导入的列（必须包含所有 key 列，否则无法更新）。下面是一个 Stream Load 的例子：

```sql
curl --location-trusted -u root: -H "partial_columns:true" -H "column_separator:," -H "columns:order_id,order_status" -T /tmp/update.csv http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

#### INSERT INTO

在所有数据模型中，`INSERT INTO` 给定部分列时默认行为是整行写入。为了防止误用，在 Merge-on-Write 实现中，`INSERT INTO` 默认仍然保持整行 UPSERT 的语义。如果需要开启部分列更新的语义，需要设置如下 session variable：

```sql
SET enable_unique_key_partial_update=true;
INSERT INTO order_tbl (order_id, order_status) VALUES (1, '待发货');
```

#### Flink Connector

如果使用 Flink Connector，需要添加如下配置：

```sql
'sink.properties.partial_columns' = 'true',
```

同时在 `sink.properties.column` 中指定要导入的列（必须包含所有 key 列，否则无法更新）。

### 更新结果

更新后结果如下：

```sql
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        |          100 | 待发货        |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

### 使用注意

由于 Merge-on-Write 实现需要在数据写入时进行整行数据的补齐，以保证最优的查询性能，因此使用 Merge-on-Write 实现进行部分列更新会导致部分导入性能下降。

写入性能优化建议：

- 使用配备 NVMe 的 SSD，或者极速 SSD 云盘。因为补齐数据时会大量读取历史数据，产生较高的读 IOPS 以及读吞吐。
- 开启行存能够大大减少补齐数据时产生的 IOPS，导入性能提升明显。用户可以在建表时通过如下 property 来开启行存：

```Plain
"store_row_column" = "true"
```

目前，同一批次数据写入任务（无论是导入任务还是 `INSERT INTO`）的所有行只能更新相同的列。如果需要更新不同列的数据，则需要分不同批次进行写入。

### 灵活部分列更新

此前，doris 支持的部分列更新功能限制了一次导入中每一行必须更新相同的列。现在，doris 支持一种更加灵活的更新方式，它使得一次导入中的每一行可以更新不同的列（3.1.0版本及以上支持）。

:::caution 注意：

1. 灵活列更新功能支持 Stream Load、Routine Load 以及使用 Stream Load 作为其导入方式的工具（如 Doris-Flink-Connector）
2. 在使用灵活列更新时导入文件必须为 JSON 格式的数据
:::

#### 适用场景

在使用 CDC 的方式将某个数据系统的数据实时同步到 Doris 中时，源端系统输出的记录可能并不是完整的行数据，而是只有主键和被更新的列的数据。在这种情况下，某个时间窗口内的一批数据中每一行更新的列可能都是不同的。此时，可以使用灵活列更新的方式来将数据导入到 Doris 中。

#### 使用方式

**存量表开启灵活列更新功能**

对于在旧版本 Doris 中已经建好的存量 Merge-On-Write 表，在升级 Doris 之后如果想要使用灵活列更新的功能，可以使用 `ALTER TABLE db1.tbl1 ENABLE FEATURE "UPDATE_FLEXIBLE_COLUMNS";` 来开启这一功能。执行完上述语句后使用 `show create table db1.tbl1` 的结果中如果包含 `"enable_unique_key_skip_bitmap_column" = "true"` 则表示功能开启成功。注意，使用这一方式之前需要确保目标表已经开启了 light-schema-change 的功能。

**新建表使用灵活列更新功能**

对于新建的表，如果需要使用灵活列更新功能，建表时需要指定如下表属性，以开启 Merge-on-Write 实现，同时使得表具有灵活列更新所需要的 `bitmap` 隐藏列。

```Plain
"enable_unique_key_merge_on_write" = "true"
"enable_unique_key_skip_bitmap_column" = "true"
```

**StreamLoad**

在使用 Stream Load 导入时添加如下 header

```Plain
unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS
```

**Flink Doris Connector**

如果使用 Flink Doris Connector，需要添加如下配置：

```Plain
'sink.properties.unique_key_update_mode' = 'UPDATE_FLEXIBLE_COLUMNS'
```

**Routine Load**

在使用 Routine Load 导入时，在 `PROPERTIES` 子句中添加如下属性：

```sql
CREATE ROUTINE LOAD db1.job1 ON tbl1
PROPERTIES (
    "format" = "json",
    "unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"
)
FROM KAFKA (
    "kafka_broker_list" = "localhost:9092",
    "kafka_topic" = "my_topic",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

也可以使用 `ALTER ROUTINE LOAD` 来修改现有 Routine Load 作业的更新模式：

```sql
-- 首先暂停作业
PAUSE ROUTINE LOAD FOR db1.job1;

-- 修改更新模式
ALTER ROUTINE LOAD FOR db1.job1
PROPERTIES (
    "unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"
);

-- 恢复作业
RESUME ROUTINE LOAD FOR db1.job1;
```

:::caution Routine Load 限制
在 Routine Load 中使用 `UPDATE_FLEXIBLE_COLUMNS` 模式时，存在以下限制：
- 数据格式必须为 JSON（`"format" = "json"`）
- 不能指定 `jsonpaths` 属性
- 不能启用 `fuzzy_parse` 选项
- 不能使用 `COLUMNS` 子句
- 不能使用 `WHERE` 子句
:::

#### 示例

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

#### 限制与注意事项

1. 和之前的部分列更新相同，灵活列更新要求导入的每一行数据需要包括所有的 Key 列，不满足这一要求的行数据将被过滤掉，同时计入 `filter rows` 的计数中，如果 `filtered rows` 的数量超过了本次导入 `max_filter_ratio` 所能容忍的上限，则整个导入将会失败。同时，被过滤的数据会在 error log 留下一条日志。

2. 灵活列更新导入中每一个 json 对象中的键值对只有当它的 Key 和目标表中某一列的列名一致时才是有效的，不满足这一要求的键值对将被忽略。同时，Key 为 `__DORIS_VERSION_COL__`/`__DORIS_ROW_STORE_COL__`/`__DORIS_SKIP_BITMAP_COL__` 的键值对也将被忽略。

3. 不支持在有 Variant 列的表上进行灵活列更新。

4. 不支持在有同步物化视图的表上进行灵活列更新。

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

### 部分列更新/灵活列更新中对新插入的行的处理

session variable或导入属性`partial_update_new_key_behavior`用于控制部分列更新和灵活列更新中插入的新行的行为。

当`partial_update_new_key_behavior=ERROR`时，插入的每一行数据必须满足该行数据的 Key 在表中已经存在。而当`partial_update_new_key_behavior=APPEND`时，进行部分列更新或灵活列更新时可以更新 Key 已经存在的行，也可以插入 Key 不存在的新行。

例如有表结构如下：
```sql
CREATE TABLE user_profile
(
    id               INT,
    name             VARCHAR(10),
    age              INT,
    city             VARCHAR(10),
    balance          DECIMAL(9, 0),
    last_access_time DATETIME
) ENGINE=OLAP
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true"
);
```

表中有一条数据如下：
```sql
mysql> select * from user_profile;
+------+-------+------+----------+---------+---------------------+
| id   | name  | age  | city     | balance | last_access_time   |
+------+-------+------+----------+---------+---------------------+
|    1 | kevin |   18 | shenzhen |     400 | 2023-07-01 12:00:00|
+------+-------+------+----------+---------+---------------------+
```

当用户在`partial_update_new_key_behavior=ERROR`的情况下使用 Insert Into 部分列更新向表中插入上述数据时，由于第二、三行的数据的 key(`(3)`, `(18)`) 不在原表中，所以本次插入会失败：
```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=ERROR;
INSERT INTO user_profile (id, balance, last_access_time) VALUES
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
(1105, "errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]tablet error: [E-7003]Can't append new rows in partial update when partial_update_new_key_behavior is ERROR. Row with key=[3] is not in table., host: 127.0.0.1")
```

当用在`partial_update_new_key_behavior=APPEND`的情况下使用 Insert Into 部分列更新向表中插入如下数据时：
```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=APPEND;
INSERT INTO user_profile (id, balance, last_access_time) VALUES 
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
```

表中原有的一条数据将会被更新，此外还向表中插入了两条新数据。对于插入的数据中用户没有指定的列，如果该列有默认值，则会以默认值填充；否则，如果该列可以为 NULL，则将以 NULL 值填充；否则本次插入不成功。

查询结果如下：
```sql
mysql> select * from user_profile;
+------+-------+------+----------+---------+---------------------+
| id   | name  | age  | city     | balance | last_access_time    |
+------+-------+------+----------+---------+---------------------+
|    1 | kevin |   18 | shenzhen |     500 | 2023-07-03 12:00:01 |
|    3 | NULL  | NULL | NULL     |      23 | 2023-07-03 12:00:02 |
|   18 | NULL  | NULL | NULL     | 9999999 | 2023-07-03 12:00:03 |
+------+-------+------+----------+---------+---------------------+
```

## 聚合模型的列更新

Aggregate 表主要在预聚合场景使用而非数据更新的场景使用，但也可以通过将聚合函数设置为 REPLACE_IF_NOT_NULL 来实现部分列更新效果。

### 建表

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
```

### 数据写入

无论是 Stream Load、Broker Load、Routine Load 还是`INSERT INTO`, 直接写入要更新的字段的数据即可

### 示例

与前面例子相同，对应的 Stream Load 命令为（不需要额外的 header）：

```shell
$ cat update.csv

1,待发货

curl  --location-trusted -u root: -H "column_separator:," -H "columns:order_id,order_status" -T ./update.csv http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

对应的`INSERT INTO`语句为（不需要额外设置 session variable）：

```sql
INSERT INTO order_tbl (order_id, order_status) values (1,'待发货');
```

### 部分列更新使用注意

Aggregate Key 模型在写入过程中不做任何额外处理，所以写入性能不受影响，与普通的数据导入相同。但是在查询时进行聚合的代价较大，典型的聚合查询性能相比 Unique Key 模型的 Merge-on-Write 实现会有 5-10 倍的下降。

由于 `REPLACE_IF_NOT_NULL` 聚合函数仅在非 NULL 值时才会生效，因此用户无法将某个字段值修改为 NULL 值。

