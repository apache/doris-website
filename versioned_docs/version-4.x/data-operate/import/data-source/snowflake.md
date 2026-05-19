---
{
    "title": "Snowflake",
    "language": "en",
    "description": "Migrate Snowflake data to Doris through object storage as an intermediate medium: export with COPY INTO to S3, then import into Doris with S3 Load.",
    "keywords": [
        "Snowflake migration to Doris",
        "Snowflake data import",
        "COPY INTO export",
        "S3 Load",
        "Snowflake Doris data type mapping",
        "ETL_QUALITY_UNSATISFIED"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data migration / Snowflake to Doris sync -->

When migrating Snowflake data to Apache Doris, object storage is typically used as an intermediate medium. The overall process consists of two steps:

1. Use Snowflake's [COPY INTO](https://docs.snowflake.cn/zh/guides-overview-unloading-data) statement to export data to object storage (such as AWS S3, GCS, or Azure Blob).
2. Use Doris's S3 Load feature to read data from object storage and import it into Doris. For detailed parameters, see [S3 Load](./amazon-s3.md).

## Pre-Migration Preparation

<!-- Knowledge type: Pre-deployment check -->

Before performing the migration, plan the corresponding table structure and import strategy in Doris based on the Snowflake table structure:

- Choose an appropriate [data model](../../../table-design/data-model/intro.mdx) (Detail model / Unique Key model / Aggregate model).
- Design [partitioning](../../../table-design/data-partitioning/dynamic-partitioning.md) and [bucketing](../../../table-design/data-partitioning/data-bucketing.md) strategies.
- Plan batch size and concurrency by referring to [Load Best Practices](../load-best-practices/load-best-practices.md).

## Data Type Mapping

<!-- Knowledge type: Configuration parameters -->

The following table lists the data type mappings between Snowflake and Doris, which helps you create matching table structures in Doris:

| Snowflake                                        | Doris          | Notes                                               |
| ------------------------------------------------ | -------------- | --------------------------------------------------- |
| NUMBER(p, s) / DECIMAL(p, s) / NUMERIC(p, s)     | DECIMAL(p, s)  |                                                     |
| INT / INTEGER                                    | INT            |                                                     |
| TINYINT / BYTEINT                                | TINYINT        |                                                     |
| SMALLINT                                         | SMALLINT       |                                                     |
| BIGINT                                           | BIGINT         |                                                     |
| FLOAT / FLOAT4 / FLOAT8 / DOUBLE / DOUBLE PRECISION / REAL | DOUBLE         |                                                     |
| VARCHAR / STRING / TEXT                          | VARCHAR / STRING | VARCHAR has a maximum length of 65535               |
| CHAR / CHARACTER / NCHAR                         | CHAR           |                                                     |
| BINARY / VARBINARY                               | STRING         |                                                     |
| BOOLEAN                                          | BOOLEAN        |                                                     |
| DATE                                             | DATE           |                                                     |
| DATETIME / TIMESTAMP / TIMESTAMP_NTZ             | DATETIME       | TIMESTAMP is a user-configurable alias, defaulting to TIMESTAMP_NTZ |
| TIME                                             | STRING         | Must be cast to String type when exporting from Snowflake |
| VARIANT                                          | VARIANT        |                                                     |
| ARRAY                                            | ARRAY\<T\>     |                                                     |
| OBJECT                                           | JSON           |                                                     |
| GEOGRAPHY / GEOMETRY                             | STRING         |                                                     |

## Migration Process

The overall migration consists of three stages: **create the target table in Doris -> export data from Snowflake to object storage -> import into Doris with S3 Load**.

### Step 1: Create the Target Table in Doris

<!-- Knowledge type: Procedure -->

Assume the following table and data already exist in Snowflake:

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

Based on this table structure, create a Unique Key partitioned table in Doris. The partition column matches Snowflake's clustering key, and dynamic partitioning is enabled by day:

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

### Step 2: Export Data from Snowflake to Object Storage

<!-- Knowledge type: Procedure -->

Snowflake supports exporting data to multiple object storage services:

- [AWS S3](https://docs.snowflake.com/en/user-guide/data-unload-s3)
- [Google Cloud Storage](https://docs.snowflake.com/en/user-guide/data-unload-gcs)
- [Azure Blob Storage](https://docs.snowflake.com/en/user-guide/data-unload-azure)

**It is recommended to partition the export by Doris's partition column**, so that subsequent imports can be performed in batches by partition.

#### 2.1 Export to Parquet Files with COPY INTO

The following example exports Snowflake data partitioned by `order_date` to AWS S3 in Parquet format:

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

#### 2.2 View the Exported Files on S3

After the export completes, S3 generates a corresponding subdirectory for each partition, with one directory per partition:

![snowflake_s3_out](/images/data-operate/snowflake_s3_out_en.png)

![snowflake_s3_out2](/images/data-operate/snowflake_s3_out2_en.png)

### Step 3: Import into Doris with S3 Load

<!-- Knowledge type: Procedure -->

S3 Load is an **asynchronous data import method**: after execution, Doris actively pulls data from the data source. It supports object storage compatible with the S3 protocol, including [AWS S3](./amazon-s3.md), [GCS](./google-cloud-storage.md), and [Azure](./azure-storage.md).

S3 Load is suitable for scenarios with **large data volumes that require background asynchronous processing**. For synchronous processing of small batches of data, you can use [TVF Load](./amazon-s3.md#method-2-load-with-tvf-synchronous).

:::caution Note
For **Parquet / ORC files containing complex types (Struct / Array / Map)**, you must currently use TVF Load.
:::

#### 3.1 Import Data from a Single Partition

The following example imports all Parquet files under the `2025_04_08` partition directory on S3 into the `sales_data` table in Doris:

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

#### 3.2 Check Job Status with SHOW LOAD

Because S3 Load is submitted asynchronously, you need to query the import status of a specific Label with `SHOW LOAD`:

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

#### 3.3 Handle Errors During Import

When there are multiple import jobs, you can query failed jobs and their failure reasons in batch with the following statement:

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

The above example is a **data quality error** (`ETL_QUALITY_UNSATISFIED`). For the specific error details, you need to access the link returned in the `URL` field. For example, the following error shows that the actual length of the `country` column in the data exceeds the length defined in the table schema:

```python
[root@VM-10-6-centos ~]$ curl "http://10.16.10.6:28747/api/_load_error_log?file=__shard_2   error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342"
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [USA] schema length: 1; actual   length: 3; . src line [];
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Canada] schema length: 1; actual   length: 6; . src line [];
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [UK] schema length: 1; actual   length: 2; . src line [];
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Australia] schema length: 1;   actual length: 9; . src line [];
```

For data quality errors, if some erroneous data is allowed to be skipped, you can set the error tolerance ratio in the `PROPERTIES` of the S3 Load job. For details, see [Import Configuration Parameters](../../import/import-way/broker-load-manual.md#related-configurations).

#### 3.4 Batch Import Multiple Partitions

<!-- Applicable scenario: Large-scale stock data migration -->

When migrating large-scale stock data, a **batched import strategy** is recommended:

- Each batch corresponds to one partition or a small number of partitions in Doris.
- The recommended size per batch is **no more than 100 GB**.
- This reduces system pressure and lowers the cost of retrying after a failed import.

You can refer to the script [s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh), which polls the partition directories on S3 and automatically submits S3 Load jobs to Doris, achieving batch import.

## FAQ

<!-- Knowledge type: FAQ / Troubleshooting -->

### Q1: An import job reports an `ETL_QUALITY_UNSATISFIED` error. How can I troubleshoot it?

This error is a data quality error. Common causes include: field length exceeding the schema definition, type mismatch, and required fields being null. Troubleshooting steps:

1. View the `URL` field of the job with `SHOW LOAD`.
2. Use `curl` to access the URL and obtain the detailed error log.
3. Fix the source data or adjust the Doris table schema based on the error message.
4. If a small amount of dirty data is acceptable, set the `max_filter_ratio` error tolerance ratio in the job `PROPERTIES`.

### Q2: How do I import Parquet files containing complex types?

For Parquet / ORC files containing complex types such as Struct / Array / Map, **S3 Load is not currently supported**. You must use [TVF Load](./amazon-s3.md#method-2-load-with-tvf-synchronous).

### Q3: Why does the Snowflake TIME type need to be converted to String?

Doris does not have a type that fully corresponds to Snowflake's `TIME`. Therefore, when exporting from Snowflake with `COPY INTO`, you need to `CAST` the `TIME` field to `STRING` type. After being imported into Doris, it is stored as `STRING`.

### Q4: How can I speed up the migration of large tables?

- On the Snowflake side, export by Doris's partition column to facilitate parallel import.
- On the Doris side, use batched imports, with each batch no larger than 100 GB.
- Use the [s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh) script to submit multiple S3 Load jobs concurrently.

### Q5: How do Snowflake's OBJECT and VARIANT types map?

- `VARIANT` maps directly to Doris's `VARIANT` type.
- `OBJECT` maps to Doris's `JSON` type.

## Related Documents

- [S3 Load](./amazon-s3.md)
- [GCS Load](./google-cloud-storage.md)
- [Azure Load](./azure-storage.md)
- [TVF Load](./amazon-s3.md#method-2-load-with-tvf-synchronous)
- [Load Best Practices](../load-best-practices/load-best-practices.md)
- [Import Configuration Parameters](../../import/import-way/broker-load-manual.md#related-configurations)
