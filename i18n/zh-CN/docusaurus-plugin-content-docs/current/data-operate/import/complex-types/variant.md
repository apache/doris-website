---
{
    "title": "VARIANT",
    "language": "zh-CN",
    "description": "如何将 CSV 与 JSON 数据导入 Doris VARIANT 列？本文按步骤介绍建表、执行 Stream Load 命令，以及验证 VARIANT 子列类型推导结果的完整流程。",
    "keywords": [
        "Doris VARIANT 导入",
        "CSV 导入 VARIANT",
        "JSON 导入 VARIANT",
        "半结构化数据",
        "Stream Load JSON",
        "Storage Format V3",
        "describe_extend_variant_column",
        "VARIANT 类型推导"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 半结构化数据导入 / VARIANT 表初始化 -->

本文介绍如何将 CSV 或 JSON 格式的数据导入 Doris 的 `VARIANT` 列，覆盖建表、数据导入与结果验证的完整流程。

## 适用读者与前置阅读

阅读本文前，请根据你的需求选择合适的参考文档：

| 你的需求 | 建议阅读 |
| --- | --- |
| 快速完成 CSV / JSON 导入 | 继续阅读本文 |
| 选择默认模式、Sparse、DOC mode 或 Schema Template | [VARIANT 使用与配置指南](../../../sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide.md) |
| 查询 VARIANT 语法、索引、限制或配置参考 | [VARIANT](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md) |

## 使用限制

- 下文示例导入的是 **CSV** 和 **JSON** 文件。导入作业会把写入 `VARIANT` 列的任何字符串字段按 JSON 解析，因此只要源列是字符串（例如 Parquet 的 `STRING` 列），其他格式也同样适用。Arrow 格式不能导入 `VARIANT` 列。

## 导入时值如何转换

- **`NOT NULL` 列：** VARIANT 值为 SQL `NULL` 的行会被过滤，包括解析失败而得到 SQL `NULL` 的值。被过滤的行计入 `max_filter_ratio`（默认 `0`），因此默认情况下导入作业会失败。
- **INSERT 的行为不同：** `INSERT` 不解析字符串。`INSERT INTO t VALUES (1, '{"a": 1}')` 写入的是 VARIANT 字符串 `{"a": 1}`，从 `s3()`、`hdfs()`、`local()` 执行 `INSERT INTO ... SELECT` 也是如此。需要写入对象时请使用 `PARSE_TO_VARIANT`。
写入表时值会被规范化：数组之外的对象成员如果值为 `null`、空对象或空数组，写入时会被移除。同一个值在查询中计算时保留所有成员：

```sql
CREATE TABLE variant_norm (k INT, v VARIANT)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO variant_norm VALUES (1, PARSE_TO_VARIANT('{"a": null, "b": {}, "c": [], "d": 1}'));

SELECT PARSE_TO_VARIANT('{"a": null, "b": {}, "c": [], "d": 1}') AS computed;
SELECT v AS stored, v['a'] IS NULL AS a_is_null FROM variant_norm;
```

```text
+--------------------------------+
| computed                       |
+--------------------------------+
| {"a":null,"b":{},"c":[],"d":1} |
+--------------------------------+

+---------+-----------+
| stored  | a_is_null |
+---------+-----------+
| {"d":1} |         1 |
+---------+-----------+
```

完整规则请参阅[写入数据](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md#write-data)与[写入后值的规范化](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md#what-storage-keeps)。

## 存储格式建议（V3）

<!-- 知识类型: 架构选型决策 -->

对于新建的 `VARIANT` 表，尤其是宽 JSON 场景，建议直接使用 **Storage Format V3**，除非你有明确的理由使用其他格式。设计原因详见 [Storage Format V3](../../../table-design/storage-format.md)。

建表时通过 `PROPERTIES` 显式开启：

```sql
CREATE TABLE table_v3 (
    id BIGINT,
    data VARIANT
)
DISTRIBUTED BY HASH(id) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```

## CSV 格式导入

### 第 1 步：准备数据

创建名为 `test_variant.csv` 的 CSV 文件，内容如下：

```SQL
14186154924|PushEvent|{"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}|{"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}|{"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}|1|2020-11-14 02:00:00
```

### 第 2 步：在库中创建表

执行以下 SQL 语句创建表：

```SQL
CREATE TABLE IF NOT EXISTS testdb.test_variant (
    id BIGINT NOT NULL,
    type VARCHAR(30) NULL,
    actor VARIANT NULL,
    repo VARIANT NULL,
    payload VARIANT NULL,
    public BOOLEAN NULL,
    created_at DATETIME NULL,
    INDEX idx_payload (`payload`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for payload'
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(id) BUCKETS 10
properties("replication_num" = "1");
```

### 第 3 步：导入数据

以 Stream Load 为例，使用如下命令导入：

```SQL
curl --location-trusted -u root:  -T test_variant.csv -H "column_separator:|" http://127.0.0.1:8030/api/testdb/test_variant/_stream_load
```

导入成功的返回示例：

```SQL
{
    "TxnId": 12,
    "Label": "96cd6250-9c78-4a9f-b8b3-2b7cef0dd606",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 660,
    "LoadTimeMs": 213,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 6,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 183,
    "ReceiveDataTimeMs": 14,
    "CommitAndPublishTimeMs": 20
}
```

### 第 4 步：检查导入数据

使用以下 SQL 查询确认数据已写入：

```SQL
mysql> select * from testdb.test_variant\G
*************************** 1. row ***************************
        id: 14186154924
      type: PushEvent
     actor: {"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}
      repo: {"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}
   payload: {"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}
    public: 1
created_at: 2020-11-14 02:00:00
```

## JSON 格式导入

### 第 1 步：准备数据

创建名为 `test_variant.json` 的 JSON 文件，内容如下：

```SQL
{"id": "14186154924","type": "PushEvent","actor": {"id": 282080,"login":"brianchandotcom","display_login": "brianchandotcom","gravatar_id": "","url": "https://api.github.com/users/brianchandotcom","avatar_url": "https://avatars.githubusercontent.com/u/282080?"},"repo": {"id": 1920851,"name": "brianchandotcom/liferay-portal","url": "https://api.github.com/repos/brianchandotcom/liferay-portal"},"payload": {"push_id": 6027092734,"size": 4,"distinct_size": 4,"ref": "refs/heads/master","head": "91edd3c8c98c214155191feb852831ec535580ba","before": "abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits": [""]},"public": true,"created_at": "2020-11-13T18:00:00Z"}
```

### 第 2 步：在库中创建表

执行以下 SQL 语句创建表：

```SQL
CREATE TABLE IF NOT EXISTS testdb.test_variant (
    id BIGINT NOT NULL,
    type VARCHAR(30) NULL,
    actor VARIANT NULL,
    repo VARIANT NULL,
    payload VARIANT NULL,
    public BOOLEAN NULL,
    created_at DATETIME NULL,
    INDEX idx_payload (`payload`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for payload'
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(id) BUCKETS 10;
```

### 第 3 步：导入数据

以 Stream Load 为例，使用如下命令导入：

```SQL
curl --location-trusted -u root:  -T test_variant.json -H "format:json"  http://127.0.0.1:8030/api/testdb/test_variant/_stream_load
```

导入成功的返回示例：

```SQL
{
    "TxnId": 12,
    "Label": "96cd6250-9c78-4a9f-b8b3-2b7cef0dd606",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 660,
    "LoadTimeMs": 213,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 6,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 183,
    "ReceiveDataTimeMs": 14,
    "CommitAndPublishTimeMs": 20
}
```

### 第 4 步：检查导入数据

使用以下 SQL 查询确认数据已写入：

```SQL
mysql> select * from testdb.test_variant\G
*************************** 1. row ***************************
        id: 14186154924
      type: PushEvent
     actor: {"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}
      repo: {"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}
   payload: {"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}
    public: 1
created_at: 2020-11-14 02:00:00
```

### 第 5 步：检查类型推导

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: VARIANT 子列类型确认 / Schema 探查 -->

默认 `DESC` 输出仅展示顶层 VARIANT 列，不展开内部子列：

```sql
mysql> desc test_variant;
+------------+---------------------------+------+-------+---------+-------+
| Field      | Type                      | Null | Key   | Default | Extra |
+------------+---------------------------+------+-------+---------+-------+
| id         | bigint                    | No   | true  | NULL    |       |
| type       | varchar(30)               | Yes  | false | NULL    | NONE  |
| actor      | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| repo       | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| payload    | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| public     | boolean                   | Yes  | false | NULL    | NONE  |
| created_at | datetime                  | Yes  | false | NULL    | NONE  |
+------------+---------------------------+------+-------+---------+-------+
7 rows in set
```

上面把列出所有列属性的 VARIANT 类型字符串简写为 `variant<PROPERTIES (...)>`。

开启 `describe_extend_variant_column` 后，可以查看 VARIANT 推导出的子列类型：

```sql
mysql> set describe_extend_variant_column = true;
Query OK, 0 rows affected (0.00 sec)

mysql> desc test_variant;
+-----------------------+---------------------------+------+-------+---------+-------+
| Field                 | Type                      | Null | Key   | Default | Extra |
+-----------------------+---------------------------+------+-------+---------+-------+
| id                    | bigint                    | No   | true  | NULL    |       |
| type                  | varchar(30)               | Yes  | false | NULL    | NONE  |
| actor                 | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| repo                  | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| payload               | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| public                | boolean                   | Yes  | false | NULL    | NONE  |
| created_at            | datetime                  | Yes  | false | NULL    | NONE  |
| actor.avatar_url      | text                      | Yes  | false | NULL    | NONE  |
| actor.display_login   | text                      | Yes  | false | NULL    | NONE  |
| actor.gravatar_id     | text                      | Yes  | false | NULL    | NONE  |
| actor.id              | bigint                    | Yes  | false | NULL    | NONE  |
| actor.login           | text                      | Yes  | false | NULL    | NONE  |
| actor.url             | text                      | Yes  | false | NULL    | NONE  |
| payload.before        | text                      | Yes  | false | NULL    | NONE  |
| payload.commits       | array<text>               | Yes  | false | NULL    | NONE  |
| payload.distinct_size | bigint                    | Yes  | false | NULL    | NONE  |
| payload.head          | text                      | Yes  | false | NULL    | NONE  |
| payload.push_id       | bigint                    | Yes  | false | NULL    | NONE  |
| payload.ref           | text                      | Yes  | false | NULL    | NONE  |
| payload.size          | bigint                    | Yes  | false | NULL    | NONE  |
| repo.id               | bigint                    | Yes  | false | NULL    | NONE  |
| repo.name             | text                      | Yes  | false | NULL    | NONE  |
| repo.url              | text                      | Yes  | false | NULL    | NONE  |
+-----------------------+---------------------------+------+-------+---------+-------+
23 rows in set
```

也可按 Partition 维度展示推导结果：

```sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

## 常见问题

### Q1：VARIANT 支持哪些导入数据格式？

导入作业会把写入 `VARIANT` 列的任何字符串字段按 JSON 解析，与文件格式无关；本文示例使用 **CSV** 与 **JSON**。使用 `INSERT`（包括从表函数执行 `INSERT INTO ... SELECT`）时，请用 `PARSE_TO_VARIANT` 包裹字符串值。

### Q2：什么场景必须使用 Storage Format V3？

对于新建的 `VARIANT` 表，尤其是字段众多的宽 JSON（wide JSON）场景，建议直接使用 V3 存储格式。如无明确理由，不推荐采用更早版本的存储格式。

### Q3：为什么 `DESC` 看不到 VARIANT 推导出来的子列？

默认情况下 `DESC` 只显示顶层 VARIANT 列。需要先执行：

```sql
SET describe_extend_variant_column = true;
```

之后再次 `DESC` 即可看到所有推导出的子列及其类型；也可通过 `DESCRIBE ${table_name} PARTITION ($partition_name)` 按分区查看。

### Q4：CSV 与 JSON 两种导入方式建表语句有何不同？

建表语句基本一致，唯一差异是 CSV 示例中显式声明了 `"replication_num" = "1"`。导入差异在于 Stream Load 命令：

| 格式 | 关键 Header |
| --- | --- |
| CSV | `-H "column_separator:\|"` |
| JSON | `-H "format:json"` |

### Q5：如何确认 Stream Load 是否导入成功？

查看返回 JSON 中的 `Status` 字段：

- `Status` 为 `Success` 表示导入成功；
- `NumberLoadedRows` 应等于 `NumberTotalRows`，且 `NumberFilteredRows` 为 `0`。

### Q6：为什么 `INSERT` 把 JSON 文本存成了字符串？

`INSERT` 通过 `CAST(string AS VARIANT)` 把字符串转换为 VARIANT，该转换保留字符串本身，不做解析。Stream Load 等导入作业会解析 JSON 文本；使用 `INSERT` 时，请用 `PARSE_TO_VARIANT` 包裹文本：

```sql
INSERT INTO testdb.test_variant (id, actor)
VALUES (1, PARSE_TO_VARIANT('{"id": 282080, "login": "brianchandotcom"}'));
```
