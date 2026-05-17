---
{
    "title": "S3",
    "language": "zh-CN",
    "description": "通过 Job + S3 TVF 从 S3 对象存储持续增量导入文件数据到 Doris 表，支持自动轮询、增量识别与按批写入。",
    "keywords": [
        "Doris S3 持续导入",
        "S3 增量导入",
        "S3 TVF Streaming Job",
        "对象存储增量同步",
        "CSV 持续导入 Doris",
        "CREATE STREAMING JOB S3"
    ]
}
---

<!-- 知识类型: 操作步骤 + 配置参数 -->
<!-- 适用场景: 从 S3 对象存储持续/增量导入数据到 Doris -->

Doris 支持通过 **Job + S3 TVF** 的方式创建持续导入作业，适用于 S3 目录下持续产生新文件、需要将其增量同步到 Doris 表的场景。

提交 Job 作业后，Doris 会持续运行该导入作业，按固定频率轮询 S3 目录，将 S3 TVF 查询到的新文件数据写入 Doris 表中。

典型用户场景：

-   日志、埋点等持续产出的 CSV/JSON/Parquet 文件需要同步到 Doris；
-   上游 ETL 持续向 S3 目录写入分片文件，下游需自动入仓；
-   希望以最小运维成本实现 S3 到 Doris 的自动增量入库。

## 基本原理

Doris 会遍历 S3 指定目录下的文件，将文件拆分为文件列表，并以**小批次**的方式将文件列表写入 Doris 表中。

### 增量读取方式

创建任务后，Doris 会持续从指定路径中读取数据，并以固定频率轮询是否有新文件。

新文件的识别规则如下：

-   新文件的名称必须按**字典序**大于上一次已导入的文件名，否则不会被识别为新文件。
-   例如：依次产生 `file1`、`file2`、`file3` 时会按顺序导入；若随后新增 `file0`，由于其字典序小于已导入的 `file3`，**Doris 不会导入该文件**。

:::tip 命名建议
为了保证新增文件能够被正确识别，建议使用时间戳、自增序号等单调递增的命名方式（如 `2025-09-22-001.csv`）。
:::

## 快速上手

完成一次持续导入通常包含以下步骤：

1.  使用 `CREATE JOB ... ON STREAMING` 创建持续导入作业。
2.  通过 `jobs()` 表函数查看导入状态与进度。
3.  根据需要使用 `ALTER JOB` 修改作业参数或 SQL。
4.  通过 [持续导入概览](./continuous-load-overview.md) 中的通用操作进行暂停、恢复、删除等管理。

### 步骤 1：创建导入作业

使用 [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) 创建持续导入作业。

假设 S3 的目录下会定期产生以 CSV 结尾的文件，可以创建如下 Job：

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
    "format" = "<format>"
)
```

### 步骤 2：查看导入状态

通过 `jobs()` 表函数查看 STREAMING 类型作业的运行情况：

```SQL
select * from jobs("type"="insert") where ExecuteType = "STREAMING"
               Id: 1758538737484
             Name: my_job1
          Definer: root
      ExecuteType: STREAMING
RecurringStrategy: \N
           Status: RUNNING
       ExecuteSql: INSERT INTO test.`student1`
SELECT * FROM S3
(
    "uri" = "s3://bucket/s3/demo/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.endpoint" = "s3.ap-southeast-1.amazonaws.com",
    "s3.region" = "ap-southeast-1",
    "s3.access_key" = "",
    "s3.secret_key" = ""
)
       CreateTime: 2025-09-22 19:24:51
 SucceedTaskCount: 1
  FailedTaskCount: 0
CanceledTaskCount: 0
          Comment: \N
       Properties: \N
    CurrentOffset: {"fileName":"s3/demo/test/1.csv"}
        EndOffset: {"fileName":"s3/demo/test/1.csv"}
    LoadStatistic: {"scannedRows":20,"loadBytes":425,"fileNumber":2,"fileSize":256}
         ErrorMsg: \N
    JobRuntimeMsg: \N
```

关键字段含义：

| 字段              | 含义                                            |
| ----------------- | ----------------------------------------------- |
| Status            | 作业状态，常见值：`RUNNING`、`PAUSED`、`STOPPED` |
| CurrentOffset     | 当前已处理的最新文件名（增量进度）              |
| EndOffset         | 当前批次结束的文件名                            |
| LoadStatistic     | 累计扫描行数、字节数、文件数、文件大小          |
| SucceedTaskCount  | 成功执行的子任务数                              |
| FailedTaskCount   | 失败的子任务数                                  |
| ErrorMsg          | 失败时的错误信息                                |

### 步骤 3：修改导入作业

支持同时修改 Job 的 `PROPERTIES` 和 `INSERT` 语句：

```SQL
-- Support modifying Job properties and insert statement
Alter Job jobName
PROPERTIES(
   "session.insert_max_filter_ratio"="0.5" 
)
INSERT INTO db1.tbl1 
select * from S3(
    "uri" = "s3://bucket/*.csv",
    "s3.access_key" = "<s3_access_key>",
    "s3.secret_key" = "<s3_secret_key>",
    "s3.region" = "<s3_region>",
    "s3.endpoint" = "<s3_endpoint>",
    "format" = "<format>"
)
```

更多通用操作（暂停、恢复、删除、查看 Task 等）请参考 [持续导入概览](./continuous-load-overview.md)。

## 参考手册

<!-- 知识类型: 配置参数 -->

### 创建作业语法

创建一个 S3 TVF 持续导入作业的语法如下：

```SQL
CREATE JOB <job_name>
ON STREAMING
[job_properties]
[ COMMENT <comment> ]
DO <Insert_Command> 
```

各模块说明：

| 模块             | 说明                                                  |
| ---------------- | ----------------------------------------------------- |
| job_name         | 任务名                                                |
| job_properties   | 用于指定 Job 的通用导入参数                           |
| comment          | 用于描述 Job 作业的备注信息                           |
| Insert_Command   | 用于执行的 SQL，即 `INSERT INTO table SELECT * FROM S3()` |

### 导入配置参数

可在 `job_properties` 中配置以下参数：

| 参数               | 默认值 | 说明                                                                                                                                                          |
| ------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| session.\*         | 无     | 支持在 `job_properties` 上配置所有的 session 变量，导入变量可参考 [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#导入配置参数) |
| s3.max_batch_files | 256    | 当累计文件数达到该值时触发一次导入写入                                                                                                                        |
| s3.max_batch_bytes | 10G    | 当累计数据量达到该值时触发一次导入写入                                                                                                                        |
| max_interval       | 10s    | 当上游没有新增文件或数据时，空闲的调度间隔                                                                                                                    |

:::tip 批次触发规则
`s3.max_batch_files` 与 `s3.max_batch_bytes` 满足任一条件即触发写入；当上游无新文件时，按 `max_interval` 进入空闲轮询。
:::

## 常见问题（FAQ）

<!-- 知识类型: FAQ -->

### Q1：为什么新增的文件没有被导入？

最常见原因是文件名的**字典序**小于 `CurrentOffset` 中已记录的文件名。请检查：

-   新文件命名是否单调递增（推荐使用时间戳或自增序号）；
-   通过 `jobs()` 查看 `CurrentOffset`，确认新文件名是否大于该值。

### Q2：如何控制每批次导入的文件数量与数据量？

通过 `s3.max_batch_files` 和 `s3.max_batch_bytes` 控制批次大小，二者满足任一即触发写入。

### Q3：作业空闲时多久轮询一次新文件？

由 `max_interval` 控制，默认 10 秒。可在 `job_properties` 中调整。

### Q4：是否支持 CSV 之外的格式？

支持。在 S3 TVF 的 `format` 参数中指定即可（如 `csv`、`json`、`parquet` 等），具体取决于 S3 TVF 支持的格式。

### Q5：如何修改已运行作业的导入 SQL？

使用 `ALTER JOB` 同时修改 `PROPERTIES` 和 `INSERT` 语句，参见 [步骤 3：修改导入作业](#步骤-3修改导入作业)。

## 故障排查（Troubleshooting）

<!-- 知识类型: 故障排查 -->

| 现象                              | 可能原因                                  | 解决方式                                                                                       |
| --------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 新文件未被导入                    | 文件名字典序小于 `CurrentOffset`          | 改用单调递增命名（如时间戳、自增序号）                                                         |
| 作业 `Status` 为 `RUNNING` 但无进度 | S3 路径下无新文件                         | 检查 `uri` 通配是否匹配新文件，必要时调小 `max_interval`                                       |
| 鉴权失败 / 无法访问 S3            | `s3.access_key`、`s3.secret_key` 等配置错误 | 检查 AK/SK、`region`、`endpoint` 是否匹配；确认 IAM 权限可读对应桶                             |
| 单批次导入过大、写入慢            | `s3.max_batch_bytes` 或 `s3.max_batch_files` 过大 | 适当调小批次阈值，使其与下游写入能力匹配                                                       |
| `FailedTaskCount` 持续增长        | 数据格式或 schema 不匹配                  | 查看 `ErrorMsg`，可通过 `session.insert_max_filter_ratio` 容忍部分异常行，或修复上游数据       |

## 相关文档

-   [持续导入概览](./continuous-load-overview.md)
-   [CREATE STREAMING JOB 语法](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
-   [Insert Into Select 导入配置参数](../../../../data-operate/import/import-way/insert-into-manual.md#导入配置参数)
