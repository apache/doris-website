---
{
    "title": "S3 一次性导入",
    "sidebar_label": "一次性导入",
    "language": "zh-CN",
    "description": "使用 Doris Streaming Job 一次性分批导入 S3 历史文件，包含目标表准备、完整 SQL、批次参数、FINISHED 完成状态、重启恢复，以及源目录稳定性和回补任务的使用限制。",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "一次性导入"
    ]
}
---

一次性导入通过 `ONE_TIME` 模式，将指定 S3 路径中匹配的文件分批导入已有的 Doris 表，最后一批事务提交后作业进入 `FINISHED`。适用于静态历史数据初始化、一次性的离线数据入仓或独立前缀下的回补任务。

创建前应准备好所有文件，导入期间保持源路径稳定。作业不会在完成后持续等待新文件；如需持续接入，使用[有序导入](./continuous-load-s3-ordered.md)或[通知导入](./continuous-load-s3-notification.md)。

## 快速上手

### 步骤 1：准备目标表和文件

先准备 Doris 目标库和表。执行账号需要目标表的 `LOAD` 权限；建库、建表还需要相应的创建权限。S3 凭证需要具有 `s3:ListBucket` 和 `s3:GetObject` 权限，Doris 节点需要能够访问对应 S3 endpoint。

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

以上为单 BE 示例，生产环境请按集群规模设置副本数。将以下内容上传到 `s3://bucket/001.csv`，并将示例中的 bucket、endpoint、Region 和凭证替换为实际值：

```text
1,Alice
2,Bob
```

### 步骤 2：创建导入作业

准备好目标表和文件后，创建 `ONE_TIME` 作业：

```sql
CREATE JOB s3_one_time_job
PROPERTIES (
    "s3.ingestion_mode" = "ONE_TIME",
    "s3.max_batch_files" = "256",
    "s3.max_batch_bytes" = "10737418240"
)
ON STREAMING DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://bucket/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.region" = "<s3_region>",
    "s3.endpoint" = "<s3_endpoint>",
    "s3.access_key" = "<s3_access_key>",
    "s3.secret_key" = "<s3_secret_key>"
);
```

## 查看导入结果

查询作业状态：

```sql
SELECT Name, ExecuteType, Status
FROM jobs("type" = "insert")
WHERE Name = 's3_one_time_job';
```

预期结果：

```text
Name             ExecuteType  Status
s3_one_time_job  STREAMING    FINISHED
```

导入完成后查询 `SELECT * FROM db1.tbl1 ORDER BY id;`，预期为：

```text
id  name
1   Alice
2   Bob
```

## 使用限制与恢复

`ONE_TIME` 不是创建作业时的目录快照。作业按批次列举文件，最后一批提交后结束，不再等待后续文件；已提交游标之前新增的文件也不会补读。请在创建作业前准备好文件，并在导入期间停止向该路径写入或覆盖对象。FE 重启后会从已提交进度恢复，确认消费结束后进入 `FINISHED`。

## 参数说明

在 Job 的 `PROPERTIES` 中配置以下参数：

| 参数 | 类型 | 默认值 | 是否必填 | 说明 |
| --- | --- | --- | --- | --- |
| `s3.ingestion_mode` | 字符串 | `ORDERED_LIST` | 是 | 必须设置为 `ONE_TIME`，创建后不可修改。 |
| `s3.max_batch_files` | 正整数 | `256` | 否 | 每批文件数量阈值。 |
| `s3.max_batch_bytes` | 整数 | `10737418240` | 否 | 每批字节数阈值，范围为 `104857600`–`10737418240`，不接受单位后缀。 |
| `max_interval` | 正整数 | `10` | 否 | 空闲调度间隔，单位为秒；不会让已完成的作业继续等待新文件。 |

不能设置 `offset`、`s3.event.source` 或 `s3.sqs.queue_url`。S3 凭证、URI 和文件格式放在 `S3(...)` 中；通用参数见 [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md#可选参数)。

导入模式和 S3 URI 创建后不可修改；更换模式或路径时需创建新作业。

## 故障排查与最佳实践

- **创建作业失败**：确认路径中存在匹配且非空的可读文件，S3 TVF 创建时需要分析其结构。
- **作业没有完成**：查询 `jobs()` 中的 `Status`、`ErrorMsg` 和失败任务；数据格式不匹配或对象不可读会阻止批次提交。
- **完成后新增文件未导入**：`FINISHED` 是结束状态。将下一批数据放入独立前缀并创建新作业，避免重新导入已处理的数据。
- **与通知作业配合**：为历史批次和后续通知使用互不重叠的前缀，或在业务侧处理重叠对象和重复数据。

暂停、恢复和查看 Task 见[持续导入通用操作](./continuous-load-overview.md#通用操作)，修改作业见 [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md)。
