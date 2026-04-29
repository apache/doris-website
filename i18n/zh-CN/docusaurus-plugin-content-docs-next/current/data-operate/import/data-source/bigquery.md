---
{
    "title": "BigQuery",
    "language": "zh-CN",
    "description": "BigQuery 数据迁移到 Apache Doris 的完整指南：通过 GCS 中转、S3 Load 导入，含数据类型映射、建表、错误排查与批量导入实践。",
    "keywords": [
        "BigQuery 迁移 Doris",
        "BigQuery 导入 Apache Doris",
        "GCS S3 Load",
        "BigQuery Export Parquet",
        "Doris 数据迁移",
        "ETL_QUALITY_UNSATISFIED"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 数据迁移 / BigQuery 到 Doris -->

本文介绍如何将 Google BigQuery 中的数据迁移到 Apache Doris。整体流程依赖对象存储作为中间媒介：

1. 通过 BigQuery 的 [Export](https://cloud.google.com/bigquery/docs/exporting-data) 语句将数据导出到 GCS（Google Cloud Storage）。
2. 在 Doris 中创建对应的目标表。
3. 利用 Doris 的 S3 Load 功能从 GCS 拉取数据并导入到 Doris，详细机制可参考 [S3 导入](./amazon-s3.md)。

## 注意事项

在开始迁移前，请关注以下事项以避免常见问题：

- **表结构设计**：需要根据 BigQuery 的表结构选择 Doris 的[数据模型](../../../table-design/data-model/intro.mdx)，以及[分区](../../../table-design/data-partitioning/dynamic-partitioning.md)和[分桶](../../../table-design/data-partitioning/data-bucketing.md)的策略，更多创建表策略可参考[导入最佳实践](../load-best-practices.md)。
- **JSON 类型导出**：BigQuery 导出 JSON 类型时不支持 Parquet 格式，需要使用 JSON 格式导出。
- **Time 类型导出**：BigQuery 导出 Time 类型时，需要 Cast 为 String 类型导出。
- **复杂类型导入**：含有复杂类型（Struct/Array/Map）的 Parquet/ORC 格式文件导入，目前必须使用 [TVF 导入](./amazon-s3.md#load-with-tvf)。

## 数据类型映射

<!-- 知识类型: 配置参数 -->

迁移前需要在 Doris 中按照如下规则建立与 BigQuery 字段对应的列类型：

| BigQuery           | Doris          | 备注                       |
| ------------------ | -------------- | -------------------------- |
| Array              | Array          |                            |
| BOOLEAN            | BOOLEAN        |                            |
| DATE               | DATE           |                            |
| DATETIME/TIMESTAMP | DATETIME       |                            |
| JSON               | JSON           |                            |
| INT64              | BIGINT         |                            |
| NUMERIC            | DECIMAL        |                            |
| FLOAT64            | DOUBLE         |                            |
| STRING             | VARCHAR/STRING | VARCHAR 长度最大 65535     |
| STRUCT             | STRUCT         |                            |
| TIME               | STRING         | 需要 Cast 为 String 导出   |
| OTHER              | UNSUPPORTED    | 暂不支持的类型             |

## 迁移步骤

### 步骤 1：在 Doris 中创建目标表

在迁移 BigQuery 表到 Doris 之前，需要先创建与之结构对应的 Doris 表。

假设 BigQuery 中已存在如下表与示例数据：

```sql
CREATE OR REPLACE TABLE test.sales_data (
    order_id      INT64,
    customer_name STRING,
    order_date    DATE,
    amount        NUMERIC(10,2),
    country       STRING
)
PARTITION BY  order_date


INSERT INTO test.sales_data (order_id, customer_name, order_date, amount, country) VALUES
(1, 'Alice', '2025-04-08', 99.99, 'USA'),
(2, 'Bob', '2025-04-08', 149.50, 'Canada'),
(3, 'Charlie', '2025-04-09', 75.00, 'UK'),
(4, 'Diana', '2025-04-10', 200.00, 'Australia');
```

根据该表结构，可以在 Doris 中创建主键分区表，分区字段与 BigQuery 的分区字段保持一致，并按天分区：

```sql
CREATE TABLE `sales_data` (
  order_id      INT,
  order_date    DATE NOT NULL,
  customer_name VARCHAR(128),
  amount        DECIMAL(10,2),
  country       VARCHAR(48)
) ENGINE=OLAP
UNIQUE KEY(`order_id`,`order_date`)
PARTITION BY RANGE(`order_date`) (
PARTITION p20250408 VALUES [('2025-04-08'), ('2025-04-09')),
PARTITION p20250409 VALUES [('2025-04-09'), ('2025-04-10')),
PARTITION p20250410 VALUES [('2025-04-10'), ('2025-04-11'))
)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 16
PROPERTIES (
 "dynamic_partition.enable" = "true",
 "dynamic_partition.time_unit" = "DAY",
 "dynamic_partition.end" = "5",
 "dynamic_partition.prefix" = "p",
 "dynamic_partition.buckets" = "16",
 "replication_num" = "1"
);
```

### 步骤 2：将 BigQuery 数据导出到 GCS

#### 2.1 通过 Export 语句导出 Parquet 文件

使用 BigQuery 的 `EXPORT DATA` 将目标表导出到 GCS：

```sql
EXPORT DATA
  OPTIONS (
    uri = 'gs://mybucket/export/sales_data/*.parquet',
    format = 'PARQUET')
AS (
  SELECT *
  FROM test.sales_data 
);
```

#### 2.2 查看 GCS 上的导出文件

以上命令会将 `sales_data` 的数据导出到 GCS，每个分区会产生一个或多个文件，文件名递增。具体规则可参考 [exporting-data](https://cloud.google.com/bigquerydocs/exporting-data#exporting_data_into_one_or_more_files)。

![gcs_export](/images/data-operate/gcs_export.png)

### 步骤 3：使用 S3 Load 将数据导入 Doris

导入采用 S3 Load 方式。**S3 Load 是一种异步的数据导入方式，执行后 Doris 会主动从数据源拉取数据**，数据源支持兼容 S3 协议的对象存储，包括 [AWS S3](./amazon-s3.md)、[GCS](./google-cloud-storage.md)、[AZURE](./azure-storage.md) 等。

该方式适用于数据量大、需要后台异步处理的场景。对于需要同步处理的数据导入，可参考 [TVF 导入](./amazon-s3.md#load-with-tvf)。

> **注意**：对于含有复杂类型（Struct/Array/Map）的 Parquet/ORC 格式文件导入，目前必须使用 TVF 导入。

#### 3.1 导入单个文件的数据

通过以下 `LOAD LABEL` 语句从 GCS 导入单个 Parquet 文件：

```sql
LOAD LABEL sales_data_2025_04_08
(
    DATA INFILE("s3://mybucket/export/sales_data/000000000000.parquet")
    INTO TABLE sales_data
    FORMAT AS "parquet"
    (order_id, order_date, customer_name, amount, country)
)
WITH S3
(
    "provider" = "GCP",
    "s3.endpoint" = "storage.asia-southeast1.rep.googleapis.com",  
    "s3.region" = "asia-southeast1",
    "s3.access_key" = "<ak>",
    "s3.secret_key" = "<sk>"
);
```

#### 3.2 通过 Show Load 查看任务运行情况

由于 S3 Load 是异步提交，可通过 `SHOW LOAD` 查询指定 label 的导入情况：

```yaml
mysql> show load where label = "label_sales_data_2025_04_08"\G
*************************** 1. row ***************************
        JobId: 17956078
        Label: label_sales_data_2025_04_08
        State: FINISHED
      Progress: 100.00% (1/1)
          Type: BROKER
      EtlInfo: unselected.rows=0; dpp.abnorm.ALL=0; dpp.norm.ALL=2
      TaskInfo: cluster:storage.asia-southeast1.rep.googleapis.com; timeout(s):3600; max_filter_ratio:0.0; priority:NORMAL
      ErrorMsg: NULL
    CreateTime: 2025-04-10 17:50:53
  EtlStartTime: 2025-04-10 17:50:54
EtlFinishTime: 2025-04-10 17:50:54
LoadStartTime: 2025-04-10 17:50:54
LoadFinishTime: 2025-04-10 17:50:54
          URL: NULL
    JobDetails: {"Unfinished backends":{"5eec1be8612d4872-91040ff1e7208a4f":[]},"ScannedRows":2,"TaskNumber":1,"LoadBytes":91,"All backends":{"5eec1be8612d4872-91040ff1e7208a4f":[10022]},"FileNumber":1,"FileSize":1620}
TransactionId: 766228
  ErrorTablets: {}
          User: root
      Comment: 
1 row in set (0.00 sec)
```

#### 3.3 处理导入过程中的错误

<!-- 知识类型: 故障排查 -->

当存在多个导入任务时，可以通过以下语句查询失败的导入及其原因：

```yaml
mysql> show load where state='CANCELLED' and label like "label_test%"\G
*************************** 1. row ***************************
        JobId: 18312384
        Label: label_test123
        State: CANCELLED
      Progress: 100.00% (3/3)
          Type: BROKER
      EtlInfo: unselected.rows=0; dpp.abnorm.ALL=4; dpp.norm.ALL=0
      TaskInfo: cluster:storage.asia-southeast1.rep.googleapis.com; timeout(s):14400; max_filter_ratio:0.0; priority:NORMAL
      ErrorMsg: type:ETL_QUALITY_UNSATISFIED; msg:quality not good enough to cancel
    CreateTime: 2025-04-15 17:32:59
  EtlStartTime: 2025-04-15 17:33:02
EtlFinishTime: 2025-04-15 17:33:02
LoadStartTime: 2025-04-15 17:33:02
LoadFinishTime: 2025-04-15 17:33:02
          URL: http://10.16.10.6:28747/api/_load_error_log?file=__shard_2/error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342
    JobDetails: {"Unfinished backends":{"7602ccd7c3a4854-95307efca7bfe341":[]},"ScannedRows":4,"TaskNumber":1,"LoadBytes":188,"All backends":{"7602ccd7c3a4854-95307efca7bfe341":[10022]},"FileNumber":3,"FileSize":4839}
TransactionId: 769213
  ErrorTablets: {}
          User: root
      Comment: 
```

上例属于**数据质量错误**（`ETL_QUALITY_UNSATISFIED`），具体原因需访问返回的 `URL` 链接获取。例如，下面的报错说明数据超出了表 Schema 中 `country` 列的实际长度：

```python
[root@VM-10-6-centos ~]$ curl "http://10.16.10.6:28747/api/_load_error_log?file=__shard_2/error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342"
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [USA] schema length: 1; actual length: 3; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Canada] schema length: 1; actual length: 6; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [UK] schema length: 1; actual length: 2; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Australia] schema length: 1; actual length: 9; . src line [];
```

对于数据质量错误，如果允许跳过部分错误数据，可以在 S3 Load 任务的 `PROPERTIES` 中设置容错率，具体参数请参考[导入配置参数](../../import/import-way/broker-load-manual.md#related-configurations)。

#### 3.4 导入多个文件的数据

当需要迁移大数据量的存量数据时，建议采用分批导入策略：

- **批次划分**：每批数据对应 Doris 的一个分区或少量几个分区。
- **单批数据量**：建议不超过 100GB，以减轻系统压力并降低导入失败后的重试成本。
- **批量脚本**：可参考 [s3_load_file_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_file_demo.sh)，该脚本可对对象存储上指定目录下的文件列表进行拆分，分批提交多个 S3 Load 任务到 Doris，实现批量导入。

## 常见问题

<!-- 知识类型: 故障排查 -->

**Q1：BigQuery 中的 JSON 类型为什么无法直接导出为 Parquet？**

BigQuery 当前不支持将 JSON 类型导出为 Parquet 格式，需将 `format` 指定为 `JSON` 后再导出，并在 Doris 中以 JSON 列对应接收。

**Q2：BigQuery 的 Time 类型在 Doris 中如何对应？**

BigQuery 的 Time 类型在导出时需 Cast 为 String 类型，Doris 中对应使用 STRING 列存储。

**Q3：导入失败提示 `ETL_QUALITY_UNSATISFIED` 怎么办？**

该错误表示数据质量未达标。处理方式如下：

1. 查看 `SHOW LOAD` 结果中的 `URL` 字段，使用 `curl` 访问获取详细错误日志。
2. 根据日志定位原因（常见为列长度溢出、类型不匹配等）。
3. 调整目标表 Schema，或在 S3 Load 的 `PROPERTIES` 中设置 `max_filter_ratio` 跳过部分错误行。

**Q4：含有 Struct/Array/Map 的 Parquet/ORC 文件能用 S3 Load 导入吗？**

不能。这类复杂类型的文件目前必须使用 [TVF 导入](./amazon-s3.md#load-with-tvf)。

**Q5：迁移大量历史数据时如何避免单任务失败造成的重试成本？**

建议按分区分批导入，每批不超过 100GB，并使用 [s3_load_file_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_file_demo.sh) 脚本批量切分提交。
