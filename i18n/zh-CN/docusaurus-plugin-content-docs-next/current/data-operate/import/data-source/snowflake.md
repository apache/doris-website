---
{
    "title": "Snowflake",
    "language": "zh-CN",
    "description": "通过对象存储中转，将 Snowflake 数据迁移到 Doris：使用 COPY INTO 导出至 S3，再用 S3 Load 导入 Doris。",
    "keywords": [
        "Snowflake 迁移 Doris",
        "Snowflake 数据导入",
        "COPY INTO 导出",
        "S3 Load",
        "Snowflake Doris 数据类型映射",
        "ETL_QUALITY_UNSATISFIED"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 数据迁移 / Snowflake 到 Doris 同步 -->

将 Snowflake 数据迁移到 Apache Doris 时，通常以对象存储作为中间媒介。整体流程分为两步：

1. 通过 Snowflake 的 [COPY INTO](https://docs.snowflake.cn/zh/guides-overview-unloading-data) 语句，将数据导出到对象存储（如 AWS S3、GCS、Azure Blob）。
2. 通过 Doris 的 S3 Load 功能，从对象存储读取数据并导入到 Doris，详细参数可参考 [S3 导入](./amazon-s3.md)。

## 迁移前准备

<!-- 知识类型: 部署前检查 -->

在执行迁移之前，需要根据 Snowflake 表结构在 Doris 中规划好相应的表结构与导入策略：

- 选择合适的[数据模型](../../../table-design/data-model/intro.mdx)（明细模型 / 主键模型 / 聚合模型）。
- 设计[分区](../../../table-design/data-partitioning/dynamic-partitioning.md)与[分桶](../../../table-design/data-partitioning/data-bucketing.md)策略。
- 参考[导入最佳实践](../load-best-practices.md)规划批次大小与并发度。

## 数据类型映射

<!-- 知识类型: 配置参数 -->

下表列出了 Snowflake 与 Doris 之间的数据类型对应关系，便于在 Doris 中创建匹配的表结构：

| Snowflake                                        | Doris          | 备注                                                |
| ------------------------------------------------ | -------------- | --------------------------------------------------- |
| NUMBER(p, s) / DECIMAL(p, s) / NUMERIC(p, s)     | DECIMAL(p, s)  |                                                     |
| INT / INTEGER                                    | INT            |                                                     |
| TINYINT / BYTEINT                                | TINYINT        |                                                     |
| SMALLINT                                         | SMALLINT       |                                                     |
| BIGINT                                           | BIGINT         |                                                     |
| FLOAT / FLOAT4 / FLOAT8 / DOUBLE / DOUBLE PRECISION / REAL | DOUBLE         |                                                     |
| VARCHAR / STRING / TEXT                          | VARCHAR / STRING | VARCHAR 长度最大 65535                              |
| CHAR / CHARACTER / NCHAR                         | CHAR           |                                                     |
| BINARY / VARBINARY                               | STRING         |                                                     |
| BOOLEAN                                          | BOOLEAN        |                                                     |
| DATE                                             | DATE           |                                                     |
| DATETIME / TIMESTAMP / TIMESTAMP_NTZ             | DATETIME       | TIMESTAMP 是用户可配置的别名，默认为 TIMESTAMP_NTZ  |
| TIME                                             | STRING         | Snowflake 导出时需要 Cast 成 String 类型            |
| VARIANT                                          | VARIANT        |                                                     |
| ARRAY                                            | ARRAY\<T\>     |                                                     |
| OBJECT                                           | JSON           |                                                     |
| GEOGRAPHY / GEOMETRY                             | STRING         |                                                     |

## 迁移流程

整体迁移分为三个阶段：**在 Doris 中创建目标表 → 从 Snowflake 导出数据到对象存储 → 通过 S3 Load 导入 Doris**。

### 步骤 1：在 Doris 中创建目标表

<!-- 知识类型: 操作步骤 -->

假设在 Snowflake 中已存在如下表和数据：

```sql
CREATE OR REPLACE TABLE sales_data (
    order_id      INT PRIMARY KEY,
    customer_name VARCHAR(128),
    order_date    DATE,
    amount        DECIMAL(10,2),
    country       VARCHAR(48)
)
CLUSTER BY (order_date);

INSERT INTO sales_data VALUES
(1, 'Alice',   '2025-04-08',  99.99, 'USA'),
(2, 'Bob',     '2025-04-08', 149.50, 'Canada'),
(3, 'Charlie', '2025-04-09',  75.00, 'UK'),
(4, 'Diana',   '2025-04-10', 200.00, 'Australia');
```

根据上述表结构，在 Doris 中创建主键分区表，分区字段与 Snowflake 的 Clustering Key 保持一致，并按天动态分区：

```sql
CREATE TABLE `sales_data` (
    order_id      INT,
    order_date    DATE NOT NULL,
    customer_name VARCHAR(128),
    amount        DECIMAL(10,2),
    country       VARCHAR(48)
) ENGINE=OLAP
UNIQUE KEY(`order_id`, `order_date`)
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

### 步骤 2：从 Snowflake 导出数据到对象存储

<!-- 知识类型: 操作步骤 -->

Snowflake 支持将数据导出到多种对象存储：

- [AWS S3](https://docs.snowflake.com/en/user-guide/data-unload-s3)
- [Google Cloud Storage](https://docs.snowflake.com/en/user-guide/data-unload-gcs)
- [Azure Blob Storage](https://docs.snowflake.com/en/user-guide/data-unload-azure)

**建议导出时按照 Doris 的分区字段进行分区**，以便后续按分区批量导入。

#### 2.1 通过 COPY INTO 导出为 Parquet 文件

以下示例将 Snowflake 数据按 `order_date` 分区导出到 AWS S3，文件格式为 Parquet：

```sql
CREATE FILE FORMAT my_parquet_format TYPE = parquet;

CREATE OR REPLACE STAGE external_stage
URL='s3://mybucket/sales_data'
CREDENTIALS=(AWS_KEY_ID='<ak>' AWS_SECRET_KEY='<sk>')
FILE_FORMAT = my_parquet_format;

COPY INTO @external_stage FROM sales_data
PARTITION BY (CAST(order_date AS VARCHAR))
HEADER=TRUE;
```

#### 2.2 查看 S3 上的导出文件

导出完成后，S3 上会按照分区生成对应的子目录，每个分区对应一个目录：

![snowflake_s3_out](/images/data-operate/snowflake_s3_out_en.png)

![snowflake_s3_out2](/images/data-operate/snowflake_s3_out2_en.png)

### 步骤 3：通过 S3 Load 导入 Doris

<!-- 知识类型: 操作步骤 -->

S3 Load 是一种**异步的数据导入方式**：执行后 Doris 会主动从数据源拉取数据。它支持兼容 S3 协议的对象存储，包括 [AWS S3](./amazon-s3.md)、[GCS](./google-cloud-storage.md)、[Azure](./azure-storage.md) 等。

S3 Load 适用于**数据量大、需要后台异步处理**的场景。如需同步处理小批量数据，可使用 [TVF 导入](./amazon-s3.md#load-with-tvf)。

:::caution 注意
对于含有**复杂类型（Struct / Array / Map）的 Parquet / ORC 格式文件**，目前必须使用 TVF 导入。
:::

#### 3.1 导入单个分区的数据

以下示例将 S3 上 `2025_04_08` 分区目录下的所有 Parquet 文件导入到 Doris 的 `sales_data` 表中：

```sql
LOAD LABEL sales_data_2025_04_08
(
    DATA INFILE("s3://mybucket/sales_data/2025_04_08/*")
    INTO TABLE sales_data
    FORMAT AS "parquet"
    (order_id, order_date, customer_name, amount, country)
)
WITH S3
(
    "provider" = "S3",
    "s3.endpoint" = "s3.ap-southeast-1.amazonaws.com",
    "s3.access_key" = "<ak>",
    "s3.secret_key" = "<sk>",
    "s3.region" = "ap-southeast-1"
);
```

#### 3.2 通过 SHOW LOAD 查看任务运行情况

由于 S3 Load 是异步提交的，需要通过 `SHOW LOAD` 查询指定 Label 的导入状态：

```yaml
mysql> show load where label = "label_sales_data_2025_04_08"\G
*************************** 1. row ***************************
        JobId: 17956078
        Label: label_sales_data_2025_04_08
        State: FINISHED
     Progress: 100.00% (1/1)
         Type: BROKER
      EtlInfo: unselected.rows=0; dpp.abnorm.ALL=0; dpp.norm.ALL=2
     TaskInfo: cluster:s3.ap-southeast-1.amazonaws.com; timeout(s):3600; max_filter_ratio:0.0; priority:NORMAL
     ErrorMsg: NULL
   CreateTime: 2025-04-10 17:50:53
 EtlStartTime: 2025-04-10 17:50:54
EtlFinishTime: 2025-04-10 17:50:54
LoadStartTime: 2025-04-10 17:50:54
LoadFinishTime: 2025-04-10 17:50:54
          URL: NULL
   JobDetails: {"Unfinished backends":{"5eec1be8612d4872-91040ff1e7208a4f":[]},"ScannedRows":2,"TaskNumber":1,"LoadBytes":91,"All   backends":{"5eec1be8612d4872-91040ff1e7208a4f":[10022]},"FileNumber":1,"FileSize":1620}
TransactionId: 766228
 ErrorTablets: {}
         User: root
      Comment:
1 row in set (0.00 sec)
```

#### 3.3 处理导入过程中的错误

当存在多个导入任务时，可通过以下语句批量查询失败任务及其失败原因：

```sql
mysql> show load where state='CANCELLED' and label like "label_test%"\G
*************************** 1. row ***************************
        JobId: 18312384
        Label: label_test123
        State: CANCELLED
     Progress: 100.00% (3/3)
         Type: BROKER
      EtlInfo: unselected.rows=0; dpp.abnorm.ALL=4; dpp.norm.ALL=0
     TaskInfo: cluster:s3.ap-southeast-1.amazonaws.com; timeout(s):14400; max_filter_ratio:0.0; priority:NORMAL
     ErrorMsg: type:ETL_QUALITY_UNSATISFIED; msg:quality not good enough to cancel
   CreateTime: 2025-04-15 17:32:59
 EtlStartTime: 2025-04-15 17:33:02
EtlFinishTime: 2025-04-15 17:33:02
LoadStartTime: 2025-04-15 17:33:02
LoadFinishTime: 2025-04-15 17:33:02
          URL: http://10.16.10.6:28747/api/_load_error_log?file=__shard_2   error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342
   JobDetails: {"Unfinished backends":{"7602ccd7c3a4854-95307efca7bfe341":[]},"ScannedRows":4,"TaskNumber":1,"LoadBytes":188,"All   backends":{"7602ccd7c3a4854-95307efca7bfe341":[10022]},"FileNumber":3,"FileSize":4839}
TransactionId: 769213
 ErrorTablets: {}
         User: root
      Comment:
```

上例属于**数据质量错误**（`ETL_QUALITY_UNSATISFIED`）。具体错误内容需要访问 `URL` 字段返回的链接查看，例如下面这条错误显示：数据中 `country` 列的实际长度超过了表 Schema 定义的长度：

```python
[root@VM-10-6-centos ~]$ curl "http://10.16.10.6:28747/api/_load_error_log?file=__shard_2   error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342"
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [USA] schema length: 1; actual   length: 3; . src line [];
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Canada] schema length: 1; actual   length: 6; . src line [];
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [UK] schema length: 1; actual   length: 2; . src line [];
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Australia] schema length: 1;   actual length: 9; . src line [];
```

对于数据质量错误，如允许跳过部分错误数据，可在 S3 Load 任务的 `PROPERTIES` 中设置容错率，详见[导入配置参数](../../import/import-way/broker-load-manual.md#related-configurations)。

#### 3.4 批量导入多个分区的数据

<!-- 适用场景: 大规模存量数据迁移 -->

迁移大规模存量数据时，建议采用**分批导入策略**：

- 每批数据对应 Doris 的一个分区或少量几个分区。
- 单批数据量建议**不超过 100 GB**。
- 可降低系统压力，并减少导入失败后的重试成本。

可参考脚本 [s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh)，该脚本会轮询 S3 上的分区目录，并自动向 Doris 提交 S3 Load 任务，实现批量导入效果。

## 常见问题

<!-- 知识类型: FAQ / 故障排查 -->

### Q1：导入任务报 `ETL_QUALITY_UNSATISFIED` 错误，如何排查？

该错误属于数据质量错误，常见原因包括：字段长度超过 Schema 定义、类型不匹配、必填字段为空等。排查步骤：

1. 通过 `SHOW LOAD` 查看任务的 `URL` 字段。
2. 使用 `curl` 访问该 URL 获取详细错误日志。
3. 根据错误信息修正源数据或调整 Doris 表 Schema。
4. 如可接受少量脏数据，可在任务 `PROPERTIES` 中设置 `max_filter_ratio` 容错率。

### Q2：含有复杂类型的 Parquet 文件如何导入？

对于含有 Struct / Array / Map 等复杂类型的 Parquet / ORC 文件，**S3 Load 暂不支持**，必须使用 [TVF 导入](./amazon-s3.md#load-with-tvf)。

### Q3：Snowflake 的 TIME 类型为什么要转换成 String？

Doris 没有与 Snowflake `TIME` 完全对应的类型，因此在 Snowflake 端使用 `COPY INTO` 导出时，需要将 `TIME` 字段 `CAST` 为 `STRING` 类型，导入 Doris 后存储为 `STRING`。

### Q4：如何加快大表迁移速度？

- 在 Snowflake 端按 Doris 的分区字段导出，便于并行导入。
- 在 Doris 端采用分批导入，每批不超过 100 GB。
- 使用 [s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh) 脚本并发提交多个 S3 Load 任务。

### Q5：Snowflake 的 OBJECT 与 VARIANT 类型如何对应？

- `VARIANT` 直接映射为 Doris 的 `VARIANT` 类型。
- `OBJECT` 映射为 Doris 的 `JSON` 类型。

## 相关文档

- [S3 导入](./amazon-s3.md)
- [GCS 导入](./google-cloud-storage.md)
- [Azure 导入](./azure-storage.md)
- [TVF 导入](./amazon-s3.md#load-with-tvf)
- [导入最佳实践](../load-best-practices.md)
- [导入配置参数](../../import/import-way/broker-load-manual.md#related-configurations)
