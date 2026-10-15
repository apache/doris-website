---
{
    "title": "S3 有序导入",
    "sidebar_label": "有序导入",
    "language": "zh-CN",
    "description": "使用 Doris Streaming Job 按 S3 文件名字典序持续导入数据，包含目标表准备、完整 SQL、起始位点配置、批次参数、进度查询，以及文件命名要求和迟到文件的处理限制。",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "有序导入"
    ]
}
---

有序导入通过 `ORDERED_LIST` 模式，按 S3 对象 key（文件名及路径）的**字典序**持续发现新文件，适用于按时间戳或递增序号命名的日志、埋点及 ETL 文件。这里的“有序”指文件发现规则，不表示目标表中的行具有顺序保证。

这是默认的 S3 导入模式，无需配置消息队列。若文件可能乱序到达，使用[通知导入](./continuous-load-s3-notification.md)；若只需导入一批已准备好的文件，使用[一次性导入](./continuous-load-s3-one-time.md)。

## 基本原理

默认的 `ORDERED_LIST` 模式会持续扫描 S3 中的文件；没有新文件时，按 `max_interval` 指定的间隔轮询。

新文件的识别规则如下：

-   新文件的名称必须按**字典序**大于上一次已导入的文件名，否则不会被识别为新文件。
-   例如：依次产生 `file1`、`file2`、`file3` 时会按顺序导入；若随后新增 `file0`，由于其字典序小于已导入的 `file3`，**Doris 不会导入该文件**。

:::tip 命名建议
为了保证新增文件能够被正确识别，建议使用时间戳、自增序号等单调递增的命名方式（如 `2025-09-22-001.csv`）。
:::

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

可以省略 `s3.ingestion_mode`，也可以在 Job 的 `PROPERTIES` 中显式设置为 `ORDERED_LIST`。

```SQL
CREATE JOB my_job
ON STREAMING
DO
INSERT INTO db1.tbl1
select * from S3(
    "uri" = "s3://bucket/*.csv",
    "s3.access_key" = "<s3_access_key>",
    "s3.secret_key" = "<s3_secret_key>",
    "s3.region" = "<s3_region>",
    "s3.endpoint" = "<s3_endpoint>",
    "format" = "csv",
    "column_separator" = ","
);
```

导入完成后，执行 `SELECT * FROM db1.tbl1 ORDER BY id;`，预期结果如下：

```text
+----+-------+
| id | name  |
+----+-------+
|  1 | Alice |
|  2 | Bob   |
+----+-------+
```

### 步骤 3：查看导入进度

```sql
SELECT Name, Status, CurrentOffset, EndOffset, ErrorMsg
FROM jobs("type" = "insert")
WHERE Name = 'my_job';
```

导入 `001.csv` 后，预期 `Status` 为 `RUNNING`，`CurrentOffset` 为 `{"fileName":"001.csv"}`。继续上传字典序更大的文件，例如 `002.csv`，作业会将其导入；没有新文件时作业保持运行并等待。

## 参数说明

在 Job 的 `PROPERTIES` 中配置以下参数，S3 连接及文件格式参数放在 `S3(...)` 中。

| 参数 | 类型 | 默认值 | 是否必填 | 说明 |
| --- | --- | --- | --- | --- |
| `s3.ingestion_mode` | 字符串 | `ORDERED_LIST` | 否 | 有序导入模式，创建后不可修改。 |
| `offset` | JSON 字符串 | 无 | 否 | 从指定 key **之后**读取，例如 `'{"fileName":"data/001.csv"}'`；不设置时从匹配路径的起点开始。 |
| `s3.max_batch_files` | 正整数 | `256` | 否 | 每批文件数量阈值，不要求累计到阈值才写入。 |
| `s3.max_batch_bytes` | 整数 | `10737418240` | 否 | 每批字节数阈值，范围为 `104857600`–`10737418240`，不接受单位后缀。 |
| `max_interval` | 正整数 | `10` | 否 | 无新文件时的轮询间隔，单位为秒。 |

### 从指定文件之后开始导入

假设 `data/001.csv` 及更早的文件已经处理，希望从 `data/002.csv` 开始读取：

```sql
CREATE JOB s3_after_offset_job
PROPERTIES (
    "s3.ingestion_mode" = "ORDERED_LIST",
    "offset" = "{\"fileName\":\"data/001.csv\"}"
)
ON STREAMING DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://bucket/data/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.region" = "<s3_region>",
    "s3.endpoint" = "<s3_endpoint>",
    "s3.access_key" = "<s3_access_key>",
    "s3.secret_key" = "<s3_secret_key>"
);
```

预期跳过 `data/001.csv` 及字典序更小的 key，仅导入之后的匹配文件。运行此示例时使用独立目标表，避免与快速上手示例重复导入。

导入模式和 S3 URI 创建后不可修改；更换模式或路径时需创建新作业。

## 故障排查与使用限制

- **新增文件未导入**：检查 key 是否匹配 URI，且字典序严格大于 `CurrentOffset`。游标之前新增的文件不会自动补读；需要回补时使用独立路径和一次性作业，或预先配置通知导入。
- **排序与预期不同**：使用固定宽度的时间戳或补零序号，例如 `000001.csv`、`000002.csv`，避免 `file10` 排在 `file2` 之前。
- **对象被覆盖或删除**：每个 key 应唯一，导入期间保持可读且内容不变；覆盖已经提交的对象不会自动触发重新导入。
- **空路径创建失败**：创建作业时 S3 TVF 需要匹配且可读的非空文件以分析结构。

暂停、恢复和查看 Task 见[持续导入通用操作](./continuous-load-overview.md#通用操作)，修改作业见 [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md)。
