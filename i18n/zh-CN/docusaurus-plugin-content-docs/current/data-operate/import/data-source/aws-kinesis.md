---
{
    "title": "AWS Kinesis",
    "language": "zh-CN",
    "description": "通过 Routine Load 将 AWS Kinesis Data Streams 持续导入 Apache Doris，涵盖准备、认证、分片起始位置和故障处理。"
}
---

Routine Load 可以持续读取 AWS Kinesis Data Streams，并将记录导入 Doris 表。一个 Stream 包含多个 Shard，Doris 使用每个 Shard 的 Sequence Number 跟踪消费进度。

:::info 版本说明
Kinesis Routine Load 在 dev 版本提供。4.x 源码分支尚未包含该数据源，本文不适用于这些版本。
:::

## 前置条件

- 使用包含 Kinesis Routine Load 的 Doris 构建版本。BE 必须能够访问 Kinesis 服务端点。
- 准备 Kinesis Stream 和凭据，授予目标 Stream 的 `kinesis:ListShards`、`kinesis:GetShardIterator`、`kinesis:GetRecords` 权限。
- Doris 账户需要创建数据库和表的权限，以及目标表的 `LOAD_PRIV`。管理已有任务也需要相应的导入权限。
- 以下生产消息的命令需要配置 AWS CLI，并授予 `kinesis:PutRecord` 权限。请使用专门的测试 Stream，或者考虑 Stream 中已有的记录。

Doris 支持 Access Key / Secret Key、携带 Session Token 的临时凭据、承担 IAM Role，以及 BE 进程可以使用的 AWS 默认凭据链。通用 AWS 认证说明参见 [AWS 认证与鉴权](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md)。

## 快速开始

### 1. 创建数据库和目标表

使用 MySQL 客户端执行以下 SQL。示例使用单副本，可在单 BE 开发集群运行；生产环境应选择适当的副本数。

```sql
CREATE DATABASE IF NOT EXISTS kinesis_demo;
USE kinesis_demo;

CREATE TABLE kinesis_events (
    id BIGINT NOT NULL,
    name STRING
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

### 2. 创建 Routine Load 任务

执行前替换 Stream 名、区域和凭据。属性名为 `kinesis_stream`，没有 `aws.` 前缀。`TRIM_HORIZON` 从 Stream 中仍被保留的最早记录开始读取。

```sql
CREATE ROUTINE LOAD kinesis_demo.kinesis_job ON kinesis_events
COLUMNS(id, name)
PROPERTIES (
    "format" = "json",
    "desired_concurrent_number" = "1"
)
FROM KINESIS (
    "aws.region" = "us-east-1",
    "kinesis_stream" = "my-test-stream",
    "aws.access_key" = "<access_key>",
    "aws.secret_key" = "<secret_key>",
    "property.kinesis_default_pos" = "TRIM_HORIZON"
);
```

如果 BE 已配置可用的 AWS 默认凭据链，可以省略 Access Key 和 Secret Key 属性。角色和临时凭据的配置参见参数表。

### 3. 写入测试记录并验证

在已为测试 Stream 配置 AWS CLI v2 的 Shell 中执行：

```shell
aws kinesis put-record \
  --region us-east-1 \
  --stream-name my-test-stream \
  --partition-key 1 \
  --cli-binary-format raw-in-base64-out \
  --data '{"id":1,"name":"Alice"}'
```

命令返回 Shard ID 和 Sequence Number。Routine Load 异步运行；任务消费并提交该记录后，在 Doris 中查询：

```sql
SELECT id, name FROM kinesis_demo.kinesis_events WHERE id = 1;
```

```text
+----+-------+
| id | name  |
+----+-------+
|  1 | Alice |
+----+-------+
```

## 参数

下表属性均放在 `FROM KINESIS (...)` 中。可选属性省略时使用默认值。`format`、`jsonpaths`、`desired_concurrent_number` 等通用任务属性放在 `PROPERTIES (...)` 中，参见 [Routine Load](../import-way/routine-load-manual.md)。

| 参数 | 类型 / 是否必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `aws.region` | 字符串；必填 | 无 | Stream 所在区域，例如 `us-east-1`。 |
| `kinesis_stream` | 字符串；必填 | 无 | Stream 名称。不要使用 `aws.kinesis_stream`。 |
| `aws.endpoint` | 字符串；可选 | 对应区域的 AWS 服务端点 | 自定义 Kinesis 服务端点，例如 LocalStack 地址。兼容旧别名 `kinesis_endpoint`，建议使用 `aws.endpoint`。 |
| `aws.access_key` | 字符串；可选 | 未显式提供凭据时使用 AWS 默认凭据链 | Access Key ID，必须与 `aws.secret_key` 一起设置。 |
| `aws.secret_key` | 字符串；可选 | 无 | 与 `aws.access_key` 配对的 Secret Key。 |
| `aws.session_key` | 字符串；可选 | 无 | 临时凭据的 Session Token。 |
| `aws.role_arn` | 字符串；可选 | 无 | 要承担的 IAM Role；凭据身份需要有承担该角色的权限。 |
| `kinesis_shards` | 逗号分隔字符串；可选 | 自动发现 Shard | 要消费的 Shard ID。 |
| `kinesis_shards_pos` | 逗号分隔字符串；可选 | 显式列出 Shard 时，每个 Shard 使用 `LATEST` | 与 `kinesis_shards` 一一对应的位置；每项为 `TRIM_HORIZON`、`LATEST` 或 Sequence Number。指定 Sequence Number 时，从该记录**之后**开始消费。 |
| `property.kinesis_default_pos` | 字符串；可选 | `LATEST` | 默认起始位置，可为 `TRIM_HORIZON`、`LATEST` 或 Sequence Number。不能与 `kinesis_shards_pos` 同时使用，不支持时间戳字符串。 |
| 其他 `property.*` | 字符串；可选 | 取决于 BE 选项 | 去除 `property.` 前缀后透传给 BE。例如 `property.aws.profile.name` 选择凭据 Profile，`property.aws.external.id` 提供承担角色的 External ID，后者需要同时配置 Role ARN。仅使用 BE 支持的选项。 |

## 查看和管理任务

```sql
SHOW ROUTINE LOAD FOR kinesis_demo.kinesis_job;
```

| 字段 | 预期含义 |
| --- | --- |
| `State` | 任务被调度且可读取 Stream 后为 `RUNNING`。若为 `PAUSED`，请检查暂停原因。 |
| `DataSourceType` | `KINESIS`。 |
| `DataSourceProperties` | 区域、Stream、服务端点和配置的 Shard。 |
| `Progress` | 每个 Shard 的 Sequence Number 进度。Sequence Number 不是 Kafka Offset，不能相加计算记录数。 |
| `Lag` | 可获取时，返回各 Shard 落后于最新记录的毫秒数。 |

```sql
PAUSE ROUTINE LOAD FOR kinesis_demo.kinesis_job;
RESUME ROUTINE LOAD FOR kinesis_demo.kinesis_job;
STOP ROUTINE LOAD FOR kinesis_demo.kinesis_job;
```

`PAUSE` 停止调度新任务，之后可以恢复。`STOP` 永久结束任务，不能恢复已停止的任务。

## 注意事项和最佳实践

- 默认的 `LATEST` 不会重放历史记录。如需读取最早保留的数据，使用 `TRIM_HORIZON`；如需控制重放位置，指定各 Shard 的位置。Kinesis 已过期的数据无法通过修改起始位置恢复。
- 显式 Shard ID 和位置的数量必须一致。不要同时设置 `kinesis_shards_pos` 和 `property.kinesis_default_pos`。
- 创建时若提示属性无效，请检查拼写以及任务属性、数据源属性的区别。`aws.kinesis_stream` 和时间戳形式的起始位置均无效。
- 任务暂停时，检查 `SHOW ROUTINE LOAD` 和 BE 日志中的认证、服务端点、Shard 和数据格式错误。JSON 记录需要与目标列或列映射相匹配。
- 根据实际 Stream 吞吐量设置并发度。Kinesis 读取限制和 Shard 分布会限制吞吐，增加任务数无法绕过 AWS 的单 Shard 限制。
