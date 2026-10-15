---
{
    "title": "S3 通知导入",
    "sidebar_label": "通知导入",
    "language": "zh-CN",
    "description": "通过 AWS S3 事件通知和独占 SQS 队列持续导入 Doris，包含目标表准备、队列策略、IAM 权限、完整 SQL、参数、积压监控，以及重复通知和历史文件不补导的使用限制。",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "通知导入"
    ]
}
---

通知导入通过 `NOTIFICATION` 模式，消费 SQS 中的 S3 对象创建事件，将新文件持续导入 Doris。适用于 UUID 文件名、乱序到达或文件名无法单调递增的场景，无需依赖文件名排序。

目前仅支持 **AWS S3 直接发送到同 Region 的 SQS Standard Queue**。每个作业需要独占队列；只处理队列中的通知，不补导历史对象。端到端采用 at-least-once 语义，可能重复导入同一对象，且不保证文件导入顺序。

## 快速上手

以下以 `s3://example-bucket/data/*.csv`、`us-east-1` 为例。将 bucket、账号、队列和凭证替换为实际值，并为一个 Streaming Job 配置一个独占的 SQS 队列。

### 准备 Doris 目标表

执行账号需要目标表的 `LOAD` 权限；建库、建表还需要相应的创建权限。使用独立的空目标表运行示例，避免与其他示例重复导入。

```sql
CREATE DATABASE IF NOT EXISTS db1;
CREATE TABLE db1.tbl1 (
    id INT,
    name STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

以上为单 BE 示例，生产环境请按集群规模设置副本数。

### 步骤 1：创建 SQS Standard Queue

在 AWS SQS 控制台创建与 S3 Bucket **相同 Region** 的 Standard Queue，记录 Queue URL 和 Queue ARN。建议将 Message retention period 设置为 14 天，以覆盖作业暂停或故障期间的积压；超过保留期的消息会被 SQS 删除。

### 步骤 2：允许 S3 向队列发送通知

将以下 Statement 合并到队列的 Access policy，并替换账号、bucket 和 queue 信息：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ToSendMessage",
      "Effect": "Allow",
      "Principal": {"Service": "s3.amazonaws.com"},
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:us-east-1:<account-id>:<queue-name>",
      "Condition": {
        "ArnEquals": {"aws:SourceArn": "arn:aws:s3:::example-bucket"},
        "StringEquals": {"aws:SourceAccount": "<account-id>"}
      }
    }
  ]
}
```

### 步骤 3：授予 Doris 访问权限

为作业使用的 IAM User 或 Role 配置以下权限。FE 需要访问 SQS 和 S3，BE 需要读取 S3 对象；使用 AssumeRole 时还需要能够访问 STS。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::example-bucket"
    },
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::example-bucket/data/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:ChangeMessageVisibility"
      ],
      "Resource": "arn:aws:sqs:us-east-1:<account-id>:<queue-name>"
    }
  ]
}
```

### 步骤 4：配置 S3 Event Notification

在 S3 Bucket 的 Event notifications 中创建通知规则：

- Event type 选择 **All object create events**（`s3:ObjectCreated:*`）。
- Prefix 填写 `data/`，Suffix 填写 `.csv`，不填写通配符。通知覆盖范围必须包含 Job 的 S3 URI 匹配范围。
- Destination 选择前面创建的 SQS Queue，直接发送 S3 事件消息，不使用 SNS 包装。

通知规则必须在上传待导入文件前生效。已有对象不会因新建通知规则而产生通知。

### 步骤 5：创建 Streaming Job

创建作业时 S3 TVF 需要分析匹配文件的结构。先在通知规则生效后，向 `data/` 上传一个非空 CSV 文件，例如内容如下的 `data/001.csv`，再执行以下 SQL。该文件会产生 SQS 通知；若仅有配置通知之前的历史对象，它们只能用于结构分析，不会因此自动补导。两种情况下，创建时都需保持至少一个匹配且可读的文件。

```text
1,Alice
2,Bob
```

```sql
CREATE JOB s3_event_job
PROPERTIES (
    "s3.ingestion_mode" = "NOTIFICATION",
    "s3.event.source" = "SQS",
    "s3.sqs.queue_url" = "https://sqs.us-east-1.amazonaws.com/<account-id>/<queue-name>",
    "max_interval" = "10"
)
ON STREAMING DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://example-bucket/data/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "provider" = "S3",
    "s3.region" = "us-east-1",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.access_key" = "<access-key>",
    "s3.secret_key" = "<secret-key>"
);
```

如需使用 IAM Role，将上述 AK/SK 两项替换为以下参数；`s3.external_id` 按角色的信任策略选填：

```sql
"s3.role_arn" = "arn:aws:iam::<account-id>:role/<role-name>",
"s3.external_id" = "<external-id>"
```

FE 使用其配置的 AWS 凭证调用 AssumeRole。角色需授予 S3 和 SQS 权限，调用方需具有 `sts:AssumeRole` 权限，角色信任策略也需允许该调用方。

作业消费 `data/001.csv` 的通知后，目标表应出现对应两行；后续上传的文件也会按通知持续导入。即使新文件的 key 小于之前处理的 key，也可以通过通知发现。通知可能重复投递，因此行数可能受目标表模型和重复导入影响。

### 步骤 6：查看通知积压

```sql
SELECT Name, Status, CurrentOffset, EndOffset, LagBytes,
       LastSourceEventTimestamp, LastTaskSuccessTime
FROM jobs("type" = "insert")
WHERE Name = 's3_event_job';
```

`CurrentOffset` 示例为 `{"fileName":"data/a.csv"}`；`EndOffset` 示例为 `{"fileName":"data/b.csv","lagMessages":12}`。通知模式下，这些 key 仅用于展示批次位置，不能作为字典序水位，也不能通过比较 key 判断是否追平。

| 字段 | 通知模式下的含义 |
| --- | --- |
| `LagBytes` | `-1`，无法获取 SQS 中积压对象的字节数。 |
| `EndOffset.lagMessages` | SQS 近似可见消息数，不包含正在处理或延迟投递的消息，也不等于待导入文件数。 |
| `LastSourceEventTimestamp` | 最近已提交批次中最大的 S3 事件时间戳（Unix 秒），不能用来推断更早事件均已处理。 |

FE 也提供以下按作业统计的指标：

```text
doris_fe_streaming_job_per_job_lag_messages
doris_fe_streaming_job_per_job_last_source_event_timestamp_seconds
```

## 通知确认与使用限制

- 只消费 SQS 中保留的通知，不扫描或补导历史对象。
- 创建作业时，路径下需要有匹配且可读的文件，不能依赖空目录或空文件完成结构推断。
- 一个队列只能由一个 Streaming Job 独占消费。Doris 会跳过并确认 URI 范围之外的记录、不支持或格式不正确的通知及 S3 测试事件；不要让多个作业通过不同 URI 共享队列。
- 对包含有效文件的通知，在对应 INSERT 事务提交后删除消息；任务执行期间会续期消息可见性，失败后可重试。FE 恢复时可利用最近已提交批次的持久化 key 处理该批次的重复投递，但不会持久化所有历史文件用于全局去重。
- S3 和 SQS 均可能重复投递，端到端仅保证 at-least-once，且不保证文件导入顺序。业务应按需要使用 Unique Key 表去重，并用 Sequence 列处理顺序相关的更新。
- 每个对象 key 应唯一且内容不可变。Doris 读取的是处理时该 key 对应的内容，不保证读取事件产生时的版本；对象提前删除会导致读取失败和重试。

## 参数说明

以下参数配置在 Job 的 `PROPERTIES` 中，S3 连接、凭证和文件格式参数放在 `S3(...)` 中。

| 参数 | 类型 | 默认值 | 是否必填 | 说明 |
| --- | --- | --- | --- | --- |
| `s3.ingestion_mode` | 字符串 | `ORDERED_LIST` | 是 | 必须设为 `NOTIFICATION`，创建后不可修改。 |
| `s3.event.source` | 字符串 | 无 | 是 | 当前仅支持 `SQS`，创建后不可修改。 |
| `s3.sqs.queue_url` | 字符串 | 无 | 是 | 独占 SQS 队列的 URL，创建后不可修改。 |
| `s3.max_batch_files` | 正整数 | `256` | 否 | 每批文件数量的软阈值。 |
| `s3.max_batch_bytes` | 整数 | `10737418240` | 否 | 每批字节数的软阈值，范围为 `104857600`–`10737418240`，不接受单位后缀。 |
| `max_interval` | 正整数 | `10` | 否 | 空闲调度间隔，单位为秒，要求 `1 <= max_interval < 7200`。 |

批次阈值不要求累计到阈值才写入。已接收的消息保持在同一批次，达到阈值后停止下一次接收，因此一批文件数或字节数可能超过阈值。不能在创建或 `ALTER JOB` 时设置 `offset`；S3 URI 也不能修改，更换路径或队列时需创建新作业。

## 故障排查与最佳实践

| 现象 | 检查与处理 |
| --- | --- |
| 创建作业失败 | 检查匹配文件是否非空且可读，以及 S3、SQS 权限和网络连通性。 |
| 作业运行但没有导入 | 检查通知是否在上传前生效，是否选择 `s3:ObjectCreated:*`，Prefix/Suffix 是否覆盖 URI，以及队列是否被其他消费者消费。 |
| 部分历史文件未导入 | 新建通知规则不会补发历史对象事件。为历史文件使用独立前缀和[一次性导入](./continuous-load-s3-one-time.md)。 |
| 暂停后部分文件未导入 | 检查消息是否超过 SQS 保留期，必要时对缺失文件单独回补。 |
| 反复读取失败 | 查看 `ErrorMsg` 和 Task 错误，确认对象未被删除或覆盖，数据格式与目标表匹配。 |
| 出现重复数据 | 检查业务主键与目标表模型；通知可能重复投递，不能依赖全历史文件去重。 |

设置足够的 SQS 消息保留期，保持对象 key 唯一且内容不可变，并结合近似积压、最近成功时间和任务错误监控作业。

暂停、恢复和查看 Task 见[持续导入通用操作](./continuous-load-overview.md#通用操作)，修改作业见 [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md)。
