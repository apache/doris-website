---
{
    "title": "BigQuery",
    "language": "en",
    "description": "A complete guide to migrating BigQuery data into Apache Doris: staging through GCS, importing with S3 Load, including data type mapping, table creation, troubleshooting, and batch import practices.",
    "keywords": [
        "BigQuery migration to Doris",
        "BigQuery import to Apache Doris",
        "GCS S3 Load",
        "BigQuery Export Parquet",
        "Doris data migration",
        "ETL_QUALITY_UNSATISFIED"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data migration / BigQuery to Doris -->

This document describes how to migrate data from Google BigQuery into Apache Doris. The overall workflow uses object storage as an intermediate medium:

1. Use BigQuery's [Export](https://cloud.google.com/bigquery/docs/exporting-data) statement to export data to GCS (Google Cloud Storage).
2. Create the corresponding target table in Doris.
3. Use Doris's S3 Load feature to pull the data from GCS into Doris. For details on the mechanism, see [S3 Load](./amazon-s3.md).

## Notes

Before starting the migration, pay attention to the following items to avoid common issues:

- **Table schema design**: Choose the appropriate Doris [data model](../../../table-design/data-model/intro.mdx), as well as [partitioning](../../../table-design/data-partitioning/dynamic-partitioning.md) and [bucketing](../../../table-design/data-partitioning/data-bucketing.md) strategies based on the BigQuery table schema. For more table creation strategies, see [Load best practices](../load-best-practices/load-best-practices.md).
- **JSON type export**: BigQuery does not support exporting JSON types in Parquet format. Use JSON format for the export instead.
- **Time type export**: When BigQuery exports a Time type, cast it to String before exporting.
- **Complex type import**: For Parquet/ORC files containing complex types (Struct/Array/Map), you must currently use [TVF Load](./amazon-s3.md#load-with-tvf).

## Data type mapping

<!-- Knowledge type: Configuration parameter -->

Before migrating, create columns in Doris that correspond to the BigQuery fields according to the following rules:

| BigQuery           | Doris          | Notes                              |
| ------------------ | -------------- | ---------------------------------- |
| Array              | Array          |                                    |
| BOOLEAN            | BOOLEAN        |                                    |
| DATE               | DATE           |                                    |
| DATETIME/TIMESTAMP | DATETIME       |                                    |
| JSON               | JSON           |                                    |
| INT64              | BIGINT         |                                    |
| NUMERIC            | DECIMAL        |                                    |
| FLOAT64            | DOUBLE         |                                    |
| STRING             | VARCHAR/STRING | VARCHAR maximum length is 65535    |
| STRUCT             | STRUCT         |                                    |
| TIME               | STRING         | Cast to String before exporting    |
| OTHER              | UNSUPPORTED    | Types not currently supported      |

## Migration steps

### Step 1: Create the target table in Doris

Before migrating a BigQuery table to Doris, first create a Doris table with a matching schema.

Assume the following table and sample data already exist in BigQuery:

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

Based on this schema, you can create a unique key partitioned table in Doris. The partition column matches the BigQuery partition column, and the table is partitioned by day:

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

### Step 2: Export BigQuery data to GCS

#### 2.1 Export Parquet files with the Export statement

Use BigQuery's `EXPORT DATA` to export the target table to GCS:

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

#### 2.2 Inspect the exported files on GCS

The command above exports `sales_data` to GCS. Each partition produces one or more files with incrementing file names. For details, see [exporting-data](https://cloud.google.com/bigquerydocs/exporting-data#exporting_data_into_one_or_more_files).

![gcs_export](/images/data-operate/gcs_export.png)

### Step 3: Import data into Doris with S3 Load

The import uses S3 Load. **S3 Load is an asynchronous data import method. After the job is submitted, Doris actively pulls data from the data source.** The data source supports object storage compatible with the S3 protocol, including [AWS S3](./amazon-s3.md), [GCS](./google-cloud-storage.md), and [Azure](./azure-storage.md).

This method is suitable for scenarios with large data volumes that need asynchronous background processing. For data imports that need synchronous processing, see [TVF Load](./amazon-s3.md#load-with-tvf).

> **Note**: For Parquet/ORC files containing complex types (Struct/Array/Map), you must currently use TVF Load.

#### 3.1 Import data from a single file

Use the following `LOAD LABEL` statement to import a single Parquet file from GCS:

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

#### 3.2 Check job status with Show Load

Because S3 Load is submitted asynchronously, use `SHOW LOAD` to query the import status for a given label:

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

#### 3.3 Handle errors during import

<!-- Knowledge type: Troubleshooting -->

When multiple import jobs exist, use the following statement to query failed imports and their causes:

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

The example above is a **data quality error** (`ETL_QUALITY_UNSATISFIED`). To get the specific cause, visit the returned `URL`. For example, the error below indicates that the data exceeds the actual length of the `country` column in the table schema:

```python
[root@VM-10-6-centos ~]$ curl "http://10.16.10.6:28747/api/_load_error_log?file=__shard_2/error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342"
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [USA] schema length: 1; actual length: 3; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Canada] schema length: 1; actual length: 6; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [UK] schema length: 1; actual length: 2; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Australia] schema length: 1; actual length: 9; . src line [];
```

For data quality errors, if skipping some erroneous rows is acceptable, set the error tolerance ratio in the S3 Load `PROPERTIES`. For details on the parameters, see [Load configuration parameters](../../import/import-way/broker-load-manual.md#related-configurations).

#### 3.4 Import data from multiple files

When migrating large volumes of historical data, use a batched import strategy:

- **Batch division**: Each batch corresponds to one Doris partition or a small number of partitions.
- **Per-batch data volume**: No more than 100 GB per batch is recommended, to reduce system pressure and lower the cost of retries after a failed import.
- **Batch script**: See [s3_load_file_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_file_demo.sh). This script splits the file list under a specified directory in object storage and submits multiple S3 Load jobs to Doris in batches, enabling batch import.

## FAQ

<!-- Knowledge type: Troubleshooting -->

**Q1: Why can JSON types in BigQuery not be exported directly as Parquet?**

BigQuery does not currently support exporting JSON types in Parquet format. Set `format` to `JSON` for the export, and use a corresponding JSON column in Doris to receive the data.

**Q2: How does the BigQuery Time type map to Doris?**

The BigQuery Time type must be cast to String during export, and stored in a STRING column in Doris.

**Q3: What should I do when an import fails with `ETL_QUALITY_UNSATISFIED`?**

This error indicates that the data does not meet quality requirements. Handle it as follows:

1. Look at the `URL` field in the `SHOW LOAD` result and use `curl` to fetch the detailed error log.
2. Identify the cause from the log (common causes include column length overflow and type mismatch).
3. Adjust the target table schema, or set `max_filter_ratio` in the S3 Load `PROPERTIES` to skip some erroneous rows.

**Q4: Can Parquet/ORC files containing Struct/Array/Map be imported with S3 Load?**

No. Files with these complex types must currently be imported with [TVF Load](./amazon-s3.md#load-with-tvf).

**Q5: How can I avoid the retry cost caused by single-job failures when migrating large volumes of historical data?**

Import in batches by partition, with no more than 100 GB per batch, and use the [s3_load_file_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_file_demo.sh) script to split and submit batches.
