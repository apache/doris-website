---
{
    "title": "列更新",
    "language": "zh-CN",
    "description": "Doris 部分列更新指南：在主键模型与聚合模型中高效更新指定列，覆盖 Stream Load、INSERT INTO、Flink Connector 与灵活列更新场景。"
}
---

<!-- 知识类型: 操作指南 + Feature 说明 -->
<!-- 适用场景: 实时字段更新 / 多源数据拼接宽表 / 数据修正 -->

在数据更新过程中，业务上经常会遇到只需要修改一行中部分字段的需求，例如：

- **实时高频字段更新**：用户标签表中需要实时更新用户最新行为字段，供广告/推荐系统进行实时分析与决策。
- **多源拼接宽表**：将多张源表的数据按主键拼接成一张大宽表，每张源表只贡献其中的若干列。
- **数据修正**：批量修正某些记录的部分字段值，而其他字段保持不变。

传统的 `UPDATE` 语句通常需要先读取整行数据，再写回完整行，这种「读—改—写」事务在大批量写入时性能较差，难以满足高吞吐场景。

**Doris 提供的部分列更新（Partial Column Update）能力**，允许在导入时只写入需要更新的列，无需先读取整行数据，从而大幅提升更新效率。本文介绍如何在 **主键模型（Unique Key Model）** 与 **聚合模型（Aggregate Key Model）** 上进行部分列更新。

## 能力概览

<!-- 知识类型: 能力定义 -->

| 数据模型 | 实现方式 | 写入性能 | 查询性能 | 适用场景 |
| --- | --- | --- | --- | --- |
| Unique Key（Merge-on-Write） | 写入时补齐整行 | 中（受 IO 影响） | 高 | 实时更新、查询性能敏感场景 |
| Aggregate Key（`REPLACE_IF_NOT_NULL`） | 查询时聚合 | 高（与普通导入相当） | 较低（聚合查询比 MoW 慢 5–10 倍） | 写入吞吐敏感、查询性能可接受的场景 |

## 主键模型的列更新

<!-- 知识类型: 操作步骤 -->

Doris 在主键模型的导入过程中提供了直接插入或更新部分列数据的能力，无需先读取整行数据，可显著提升更新效率。

:::caution 注意

1. 2.0 版本仅在 Unique Key 的 Merge-on-Write 实现中支持部分列更新能力。
2. 从 2.0.2 版本开始，支持使用 `INSERT INTO` 进行部分列更新。
3. 不支持在有同步物化视图的表上进行部分列更新。
4. 不支持在进行 Schema Change 的表上进行部分列更新。

:::

### 使用示例

假设 Doris 中存在一张订单表 `order_tbl`，其中订单 ID 是 Key 列，订单状态和订单金额是 Value 列。当前数据如下：

| 订单 ID | 订单金额 | 订单状态 |
| --- | --- | --- |
| 1 | 100 | 待付款 |

```sql
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        |          100 | 待付款       |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

此时，用户点击付款后，需要将订单 ID 为 `1` 的订单状态变更为 `待发货`，且不影响订单金额字段。

### 通过导入方式进行部分列更新

#### Stream Load / Broker Load / Routine Load

准备如下 CSV 文件：

```text
1,待发货
```

在导入时添加如下 header：

```text
partial_columns:true
```

同时在 `columns` 参数中指定要导入的列（**必须包含所有 Key 列**，否则无法更新）。下面是一个 Stream Load 的例子：

```shell
curl --location-trusted -u root: \
    -H "partial_columns:true" \
    -H "column_separator:," \
    -H "columns:order_id,order_status" \
    -T /tmp/update.csv \
    http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

#### INSERT INTO

在所有数据模型中，`INSERT INTO` 给定部分列时默认行为是整行写入。为了防止误用，在 Merge-on-Write 实现中，`INSERT INTO` 默认仍保持整行 UPSERT 的语义。如果需要开启部分列更新语义，需要先设置如下 session variable：

```sql
SET enable_unique_key_partial_update=true;
INSERT INTO order_tbl (order_id, order_status) VALUES (1, '待发货');
```

#### Flink Connector

如果使用 Flink Connector，需要添加如下配置：

```text
'sink.properties.partial_columns' = 'true'
```

同时在 `sink.properties.column` 中指定要导入的列（**必须包含所有 Key 列**，否则无法更新）。

### 更新结果

更新后结果如下：

```sql
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        |          100 | 待发货       |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

### 使用注意事项

<!-- 知识类型: 性能调优 -->

由于 Merge-on-Write 实现需要在数据写入时进行整行数据的补齐，以保证最优的查询性能，因此使用 Merge-on-Write 实现进行部分列更新会导致部分导入性能下降。

**写入性能优化建议：**

- **使用高性能 SSD**：建议使用配备 NVMe 的 SSD 或极速 SSD 云盘。补齐数据时会大量读取历史数据，产生较高的读 IOPS 与读吞吐。
- **开启行存**：可大幅减少补齐数据时产生的 IOPS，导入性能提升明显。建表时通过如下属性开启：

    ```text
    "store_row_column" = "true"
    ```

**批次约束：** 同一批次写入任务（无论是导入任务还是 `INSERT INTO`）的所有行只能更新相同的列。如需更新不同列，需分多个批次写入。该约束可通过下文的「灵活列更新」功能解除。

### 灵活列更新

<!-- 知识类型: Feature 说明 -->
<!-- 适用场景: CDC 实时同步 / 每行更新列不一致的场景 -->

此前，Doris 支持的部分列更新功能限制了一次导入中每一行必须更新相同的列。从 **3.1.0 版本开始**，Doris 支持一种更加灵活的更新方式：**一次导入中每一行可以更新不同的列**。

:::caution 注意

1. 灵活列更新功能支持 Stream Load、Routine Load 以及使用 Stream Load 作为底层导入方式的工具（如 Doris-Flink-Connector）。
2. 在使用灵活列更新时，导入文件必须为 JSON 格式。

:::

#### 适用场景

在使用 CDC 方式将某个数据系统的数据实时同步到 Doris 时，源端系统输出的记录可能并不是完整的行数据，而仅包含主键和被更新的列。这种情况下，某个时间窗口内的一批数据中每一行更新的列可能都不相同，此时即可使用灵活列更新方式将数据导入 Doris。

#### 使用方式

##### 1. 开启灵活列更新功能

**新建表：** 建表时指定如下属性，开启 Merge-on-Write 实现，并使表具备灵活列更新所需的 `bitmap` 隐藏列：

```text
"enable_unique_key_merge_on_write" = "true"
"enable_unique_key_skip_bitmap_column" = "true"
```

**存量表：** 对于在旧版本 Doris 中已建好的存量 Merge-on-Write 表，升级 Doris 之后可以通过以下语句开启灵活列更新功能：

```sql
ALTER TABLE db1.tbl1 ENABLE FEATURE "UPDATE_FLEXIBLE_COLUMNS";
```

执行后通过 `SHOW CREATE TABLE db1.tbl1` 查看，若结果中包含 `"enable_unique_key_skip_bitmap_column" = "true"` 即表示开启成功。

:::tip
存量表使用此方式之前，需要确保目标表已开启 light-schema-change 功能。
:::

##### 2. 在导入任务中启用

不同导入方式的配置如下：

| 导入方式 | 配置项 | 配置值 |
| --- | --- | --- |
| Stream Load | header | `unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS` |
| Flink Doris Connector | sink property | `'sink.properties.unique_key_update_mode' = 'UPDATE_FLEXIBLE_COLUMNS'` |
| Routine Load | `PROPERTIES` | `"unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"` |

**Routine Load 完整示例：**

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

也可以使用 `ALTER ROUTINE LOAD` 修改现有 Routine Load 作业的更新模式：

```sql
-- 1. 暂停作业
PAUSE ROUTINE LOAD FOR db1.job1;

-- 2. 修改更新模式
ALTER ROUTINE LOAD FOR db1.job1
PROPERTIES (
    "unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"
);

-- 3. 恢复作业
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

#### 完整示例

**步骤 1：创建测试表**

```sql
CREATE TABLE t1 (
    `k`  INT NULL,
    `v1` BIGINT NULL,
    `v2` BIGINT NULL DEFAULT "9876",
    `v3` BIGINT NOT NULL,
    `v4` BIGINT NOT NULL DEFAULT "1234",
    `v5` BIGINT NULL
) UNIQUE KEY(`k`)
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "replication_num" = "3",
    "enable_unique_key_merge_on_write" = "true",
    "enable_unique_key_skip_bitmap_column" = "true"
);
```

**步骤 2：表中已有原始数据**

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

**步骤 3：准备灵活列更新数据**

每一行可以更新不同的列：

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

**步骤 4：通过 Stream Load 导入**

```shell
curl --location-trusted -u root: \
    -H "Expect:100-continue" \
    -H "strict_mode:false" \
    -H "format:json" \
    -H "read_json_by_line:true" \
    -H "unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS" \
    -T test1.json \
    -XPUT http://<host>:<http_port>/api/d1/t1/_stream_load
```

**步骤 5：查看更新结果**

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

1. 与普通部分列更新一致，灵活列更新要求每一行数据都包含**所有 Key 列**。不满足该要求的行会被过滤并计入 `filter rows`；当 `filtered rows` 超过本次导入 `max_filter_ratio` 所允许的上限时，整个导入将失败。被过滤的数据会在 error log 中记录一条日志。
2. JSON 对象中的键值对，仅当 Key 与目标表的列名一致时才有效，不满足者将被忽略。此外，Key 为 `__DORIS_VERSION_COL__`、`__DORIS_ROW_STORE_COL__`、`__DORIS_SKIP_BITMAP_COL__` 的键值对也将被忽略。
3. 不支持在含有 Variant 列的表上进行灵活列更新。
4. 不支持在有同步物化视图的表上进行灵活列更新。
5. 使用灵活列更新时，**不能**指定或开启以下导入参数：
    - `merge_type`
    - `delete`
    - `fuzzy_parse`
    - `columns`
    - `jsonpaths`
    - `hidden_columns`
    - `function_column.sequence_col`
    - `sql`
    - `memtable_on_sink_node` 前移
    - `group_commit`
    - `where`

### 新插入行的行为控制

<!-- 知识类型: 配置参数 -->

session variable 或导入属性 `partial_update_new_key_behavior` 用于控制部分列更新和灵活列更新中**新插入行**的行为。

| 取值 | 行为 |
| --- | --- |
| `ERROR` | 每一行的 Key 必须在表中已经存在，否则导入失败 |
| `APPEND` | 既可以更新已存在的行，也可以插入 Key 不存在的新行 |

#### 示例表结构

```sql
CREATE TABLE user_profile (
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

表中现有数据：

```sql
mysql> select * from user_profile;
+----+-------+-----+----------+---------+---------------------+
| id | name  | age | city     | balance | last_access_time    |
+----+-------+-----+----------+---------+---------------------+
|  1 | kevin |  18 | shenzhen |     400 | 2023-07-01 12:00:00 |
+----+-------+-----+----------+---------+---------------------+
```

#### 场景 1：`ERROR` 模式（拒绝新行）

由于第二、三行的 Key（`3`、`18`）在原表中不存在，本次插入会失败：

```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=ERROR;

INSERT INTO user_profile (id, balance, last_access_time) VALUES
    (1, 500, '2023-07-03 12:00:01'),
    (3, 23, '2023-07-03 12:00:02'),
    (18, 9999999, '2023-07-03 12:00:03');

-- 报错：
-- (1105, "errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]tablet error:
-- [E-7003]Can't append new rows in partial update when partial_update_new_key_behavior is ERROR.
-- Row with key=[3] is not in table., host: 127.0.0.1")
```

#### 场景 2：`APPEND` 模式（允许新行）

```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=APPEND;

INSERT INTO user_profile (id, balance, last_access_time) VALUES
    (1, 500, '2023-07-03 12:00:01'),
    (3, 23, '2023-07-03 12:00:02'),
    (18, 9999999, '2023-07-03 12:00:03');
```

执行后，原有的一条数据被更新，并新增两行。对于用户未指定的列：

1. 若该列**有默认值**，则用默认值填充；
2. 否则，若该列**允许 NULL**，则用 NULL 填充；
3. 否则，本次插入失败。

查询结果：

```sql
mysql> select * from user_profile;
+----+-------+------+----------+---------+---------------------+
| id | name  | age  | city     | balance | last_access_time    |
+----+-------+------+----------+---------+---------------------+
|  1 | kevin |   18 | shenzhen |     500 | 2023-07-03 12:00:01 |
|  3 | NULL  | NULL | NULL     |      23 | 2023-07-03 12:00:02 |
| 18 | NULL  | NULL | NULL     | 9999999 | 2023-07-03 12:00:03 |
+----+-------+------+----------+---------+---------------------+
```

## 聚合模型的列更新

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 写入吞吐敏感、可接受较低查询性能 -->

Aggregate 表主要用于预聚合场景，但也可以通过将聚合函数设置为 `REPLACE_IF_NOT_NULL` 来实现部分列更新效果。

### 建表

将需要进行列更新的字段对应的聚合函数设置为 `REPLACE_IF_NOT_NULL`：

```sql
CREATE TABLE order_tbl (
    order_id     INT(11) NULL,
    order_amount INT(11) REPLACE_IF_NOT_NULL NULL,
    order_status VARCHAR(100) REPLACE_IF_NOT_NULL NULL
) ENGINE=OLAP
AGGREGATE KEY(order_id)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 数据写入

无论是 Stream Load、Broker Load、Routine Load 还是 `INSERT INTO`，直接写入要更新的字段数据即可，**无需任何额外参数**。

### 示例

与前文示例相同，对应的 Stream Load 命令为（不需要额外的 header）：

```shell
$ cat update.csv
1,待发货

curl --location-trusted -u root: \
    -H "column_separator:," \
    -H "columns:order_id,order_status" \
    -T ./update.csv \
    http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

对应的 `INSERT INTO` 语句为（不需要额外设置 session variable）：

```sql
INSERT INTO order_tbl (order_id, order_status) VALUES (1, '待发货');
```

### 使用注意事项

- **写入性能**：Aggregate Key 模型在写入过程中不做任何额外处理，写入性能与普通数据导入一致。
- **查询性能**：查询时进行聚合代价较大，典型的聚合查询性能相比 Unique Key 模型的 Merge-on-Write 实现会有 **5–10 倍** 的下降。
- **NULL 值限制**：由于 `REPLACE_IF_NOT_NULL` 聚合函数仅在非 NULL 值时才会生效，因此**无法将某个字段值修改为 NULL**。
