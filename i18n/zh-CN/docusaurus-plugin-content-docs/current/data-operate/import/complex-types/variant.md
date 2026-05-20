---
{
    "title": "VARIANT",
    "language": "zh-CN",
    "description": "如何将 CSV 与 JSON 数据导入 Doris VARIANT 列？提供建表、Stream Load 命令、类型推导验证完整步骤。",
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
| 选择默认模式、Sparse、DOC mode 或 Schema Template | [VARIANT 使用与配置指南](../../../sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide) |
| 查询 VARIANT 语法、索引、限制或配置参考 | [VARIANT](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT) |

## 使用限制

- 当前仅支持 **CSV** 和 **JSON** 两种数据格式导入 `VARIANT` 列。

## 存储格式建议（V3）

<!-- 知识类型: 架构选型决策 -->

对于新建的 `VARIANT` 表，尤其是宽 JSON 场景，建议直接使用 **Storage Format V3**，除非你有明确的理由使用其他格式。设计原因详见 [Storage Format V3](../../../table-design/storage-format)。

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

``` sql
mysql> desc github_events;
+------------------------------------------------------------+------------+------+-------+---------+-------+
| Field                                                      | Type       | Null | Key   | Default | Extra |
+------------------------------------------------------------+------------+------+-------+---------+-------+
| id                                                         | BIGINT     | No   | true  | NULL    |       |
| type                                                       | VARCHAR(*) | Yes  | false | NULL    | NONE  |
| actor                                                      | VARIANT    | Yes  | false | NULL    | NONE  |
| created_at                                                 | DATETIME   | Yes  | false | NULL    | NONE  |
| payload                                                    | VARIANT    | Yes  | false | NULL    | NONE  |
| public                                                     | BOOLEAN    | Yes  | false | NULL    | NONE  |
+------------------------------------------------------------+------------+------+-------+---------+-------+
6 rows in set (0.07 sec)
```

开启 `describe_extend_variant_column` 后，可以查看 VARIANT 推导出的子列类型：

``` sql
mysql> set describe_extend_variant_column = true;
Query OK, 0 rows affected (0.01 sec)

mysql> desc github_events;
+------------------------------------------------------------+------------+------+-------+---------+-------+
| Field                                                      | Type       | Null | Key   | Default | Extra |
+------------------------------------------------------------+------------+------+-------+---------+-------+
| id                                                         | BIGINT     | No   | true  | NULL    |       |
| type                                                       | VARCHAR(*) | Yes  | false | NULL    | NONE  |
| actor                                                      | VARIANT    | Yes  | false | NULL    | NONE  |
| actor.avatar_url                                           | TEXT       | Yes  | false | NULL    | NONE  |
| actor.display_login                                        | TEXT       | Yes  | false | NULL    | NONE  |
| actor.id                                                   | INT        | Yes  | false | NULL    | NONE  |
| actor.login                                                | TEXT       | Yes  | false | NULL    | NONE  |
| actor.url                                                  | TEXT       | Yes  | false | NULL    | NONE  |
| created_at                                                 | DATETIME   | Yes  | false | NULL    | NONE  |
| payload                                                    | VARIANT    | Yes  | false | NULL    | NONE  |
| payload.action                                             | TEXT       | Yes  | false | NULL    | NONE  |
| payload.before                                             | TEXT       | Yes  | false | NULL    | NONE  |
| payload.comment.author_association                         | TEXT       | Yes  | false | NULL    | NONE  |
| payload.comment.body                                       | TEXT       | Yes  | false | NULL    | NONE  |
....
+------------------------------------------------------------+------------+------+-------+---------+-------+
406 rows in set (0.07 sec)
```

也可按 Partition 维度展示推导结果：

``` sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

## 常见问题

### Q1：VARIANT 支持哪些导入数据格式？

当前 `VARIANT` 列的导入仅支持 **CSV** 与 **JSON** 两种格式。其他格式需先转换后再导入。

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
| CSV | `-H "column_separator:|"` |
| JSON | `-H "format:json"` |

### Q5：如何确认 Stream Load 是否导入成功？

查看返回 JSON 中的 `Status` 字段：

- `Status` 为 `Success` 表示导入成功；
- `NumberLoadedRows` 应等于 `NumberTotalRows`，且 `NumberFilteredRows` 为 `0`。
