---
{
    "title": "AWS-Kinesis",
    "language": "zh-CN",
    "description": "Apache Doris 以 Routine Load 的方式从 AWS Kinesis Data Streams 持续导入数据。能够自动、持续地从 Kinesis 流中消费数据并导入到 Doris 表中。"
}
---

## 基本原理

### 核心概念映射

| Kinesis | Kafka | 说明 |
| --- | --- | --- |
| Stream | Topic | 数据流的命名集合 |
| Shard | Partition | 流中的数据分片，每个 Shard 有独立的数据序列 |
| Sequence Number | Offset | 记录在 Shard 中的唯一标识符 |
| GetRecords | Consume | 从流中读取数据的 API |

### AWS认证方式

kinesis导入的AWS认证方式可以完全参考从MSK中导入数据的认证方式：[Routine Load 手册](./aws-msk.md)

## 参数

| 参数名 | 说明 | 默认值 | 示例 |
| --- | --- | --- | --- |
| aws.region | AWS Region | 手动填写 | `"us-east-1"` |
| aws.access_key | AWS Access Key ID | 手动填写 | `\` |
| aws.secret_key | AWS Secret Access Key | 手动填写 | `\` |
| aws.role_arn | 跨账号访问凭证 role | 手动填写 | `"arn:aws:iam::123456789012:role/MyRole"` |
| kinesis_stream | Kinesis Stream 名称 | 手动填写 | `"my-data-stream"` |
| kinesis_shards | 指定要消费的 shard ID 列表，逗号分隔。 | 默认选择所有 shards | `"shardId-000000000001,shardId-000000000002"` |
| kinesis_shards_pos | 每个 shard 的起始位置，逗号分隔，与 `kinesis_shards` 一一对应。 | `LATEST` | `TRIM_HORIZON`（最早）、`LATEST`（最新）、`sequence number` |
| property.kinesis_default_pos | 默认 shard 的起始位置，未指定 `kinesis_shards_pos` 时按照该标准读取。 | `LATEST` | `TRIM_HORIZON`（最早）、`LATEST`（最新）、时间戳 `"2026-01-01 00:00:00"` |
| 其余 `property.*` | 该前缀的参数会从 FE 透传到 BE | `\` | `\` |

## 快速上手

由于 Doris 采用 Routine Load 的方式从 Kinesis 读取数据，因此操作方式与 [Routine Load 手册](../import-way/routine-load-manual.md) 一致.

### 创建导入

```
CREATE ROUTINE LOAD [db_name.]job_name ON table_name
[load_properties]
[job_properties]
FROM KINESIS
(
    "aws.region" = "us-east-1",
    "aws.kinesis_stream" = "<your_stream_name>",
    "aws.access_key" = "<your_ak>",
    "aws.secret_key" = "<your_sk>"
);
```


### 查看导入状态

```SQL
SHOW ROUTINE LOAD FOR job_name;
```

输出字段说明（仅展示kinesis相关）

| 字段 | 说明 |
| --- | --- |
| DataSourceType | 数据源类型：KINESIS |
| DataSourceProperties | Kinesis 数据源配置（region, stream, shards） |
| Progress | 消费进度（每个 Shard 的 Sequence Number） |
| Lag | 消费延迟（每个 Shard 距离最新数据的毫秒数） |

### 暂停导入作业

```SQL
PAUSE ROUTINE LOAD FOR job_name;
```

### 恢复导入作业

```SQL
RESUME ROUTINE LOAD FOR job_name;
```

### 删除导入作业

```SQL
STOP ROUTINE LOAD FOR job_name;
```