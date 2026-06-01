---
{
    "title": "Redshift",
    "language": "en",
    "description": "Migrate data from Redshift to Doris by exporting to S3 with Redshift UNLOAD and then loading into Doris with S3 Load. Covers table creation, data type mapping, error handling, and batch loading.",
    "keywords": [
        "Redshift to Doris migration",
        "Redshift UNLOAD",
        "S3 Load",
        "Redshift data type mapping",
        "Doris data import",
        "Parquet load",
        "ETL_QUALITY_UNSATISFIED"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data migration / Redshift to Doris -->

When migrating data from Redshift to Apache Doris, an object storage service (such as Amazon S3) is typically used as an intermediate medium. The overall migration flow is as follows:

1. Create the target table in Doris based on the source table schema.
2. Export the data to object storage with the Redshift [UNLOAD](https://docs.aws.amazon.com/redshift/latest/dg/r_UNLOAD.html) statement.
3. Use the Doris S3 Load feature to read the data from object storage and load it into Doris. For details, see [S3 Load](./amazon-s3.md).

## Notes

Before performing the migration, pay attention to the following points:

- **Modeling and partitioning strategy**: Choose an appropriate Doris [data model](../../../table-design/data-model/intro.mdx) based on the Redshift source table schema, and define a [partitioning](../../../table-design/data-partitioning/dynamic-partitioning.md) and [bucketing](../../../table-design/data-partitioning/data-bucketing.md) strategy. For more table design recommendations, see [Load Best Practices](../load-best-practices/load-best-practices.md).
- **Type conversion**: When Redshift exports the `TIME` type, you must first `CAST` it to `VARCHAR` before exporting.
- **Complex type limitations**: Parquet/ORC files that contain complex types (Struct/Array/Map) currently must be loaded with [TVF Load](./amazon-s3.md#method-2-load-with-tvf-synchronous).

## Data Type Mapping

<!-- Knowledge type: Configuration -->

Before the migration, map the Redshift data types to Doris data types according to the table below:

| Redshift         | Doris          | Notes                            |
| ---------------- | -------------- | -------------------------------- |
| SMALLINT         | SMALLINT       |                                  |
| INTEGER          | INT            |                                  |
| BIGINT           | BIGINT         |                                  |
| DECIMAL          | DECIMAL        |                                  |
| REAL             | FLOAT          |                                  |
| DOUBLE PRECISION | DOUBLE         |                                  |
| BOOLEAN          | BOOLEAN        |                                  |
| CHAR             | CHAR           |                                  |
| VARCHAR          | VARCHAR/STRING | VARCHAR maximum length is 65535  |
| DATE             | DATE           |                                  |
| TIMESTAMP        | DATETIME       |                                  |
| TIME/TIMEZ       | STRING         |                                  |
| SUPER            | VARIANT        |                                  |
| OTHER            | UNSUPPORTED    |                                  |

## Migration Steps

### 1. Create the Doris Table

<!-- Knowledge type: Procedure -->

Before the migration, create the corresponding target table in Doris.

**Goal**: Plan the Doris data model, partitioning, and bucketing strategy based on the Redshift source table schema.

**Redshift source table example**:

```SQL
CREATE TABLE sales_data (
    order_id      INTEGER,
    customer_name VARCHAR(128),
    order_date    DATE,
    amount        DECIMAL(10,2),
    country       VARCHAR(48)
)
DISTSTYLE AUTO;

INSERT INTO sales_data VALUES
(1, 'Alice', '2025-04-08', 99.99, 'USA'),
(2, 'Bob', '2025-04-08', 149.50, 'Canada'),
(3, 'Charlie', '2025-04-09', 75.00, 'UK'),
(4, 'Diana', '2025-04-10', 200.00, 'Australia');
```

**Doris target table example**: Based on the schema above, create a Unique Key partitioned table that uses `order_date` as the partition column and partitions by day:

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

### 2. Export Data from Redshift to S3

<!-- Knowledge type: Procedure -->

#### 2.1 Use UNLOAD to Export as Parquet

**Goal**: Export Redshift data as Parquet files split by the Doris partition column, so that the data can later be loaded partition by partition.

**Command**:

```sql
unload ('select * from sales_data')
to 's3://mybucket/redshift/sales_data/'
iam_role 'arn:aws:iam::0123456789012:role/MyRedshiftRole'
PARQUET
PARTITION BY (order_date) INCLUDE
```

**Note**: It is recommended to export with the same partition column used in Doris, so that the data can be loaded in batches by partition.

#### 2.2 Verify the Exported Files on S3

After the export, S3 generates a subdirectory for each partition, and each directory contains the data of one partition:

![redshift_out](/images/data-operate/redshift_out.png)

![redshift_out2](/images/data-operate/redshift_out2.png)

### 3. Load Data into Doris

<!-- Knowledge type: Procedure -->

The load uses **S3 Load**, an asynchronous data load method in which Doris actively pulls data from the data source after the job is submitted. The data source supports any S3-compatible object storage, including [AWS S3](./amazon-s3.md), [GCS](./google-cloud-storage.md), and [AZURE](./azure-storage.md).

Comparison of applicable scenarios:

| Scenario                                          | Recommended method                              |
| ------------------------------------------------- | ----------------------------------------------- |
| Large data volume, can be processed asynchronously | S3 Load                                         |
| Synchronous data load is required                 | [TVF Load](./amazon-s3.md#method-2-load-with-tvf-synchronous)        |
| Files contain complex types (Struct/Array/Map)    | [TVF Load](./amazon-s3.md#method-2-load-with-tvf-synchronous) is required |

#### 3.1 Load a Single Partition

```sql
LOAD LABEL sales_data_2025_04_08
(
    DATA INFILE("s3://mybucket/redshift/sales_data/order_date=2025-04-08/*")
    INTO TABLE sales_data
    FORMAT AS "parquet"
    (order_id, order_date, customer_name, amount, country)
)
WITH S3
(
    "provider" = "S3",
    "s3.endpoint" = "s3.ap-southeast-1.amazonaws.com",
    "s3.access_key" = "<ak>",
    "s3.secret_key"="<sk>",
    "s3.region" = "ap-southeast-1"
);
```

#### 3.2 Check Job Status with SHOW LOAD

Because S3 Load is submitted asynchronously, you can use `SHOW LOAD` with the job label to check load progress:

```yaml
mysql> show load where label = "sales_data_2025_04_08"\G
*************************** 1. row ***************************
         JobId: 17956078
         Label: sales_data_2025_04_08
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
    JobDetails: {"Unfinished backends":{"5eec1be8612d4872-91040ff1e7208a4f":[]},"ScannedRows":2,"TaskNumber":1,"LoadBytes":91,"All backends":{"5eec1be8612d4872-91040ff1e7208a4f":[10022]},"FileNumber":1,"FileSize":1620}
 TransactionId: 766228
  ErrorTablets: {}
          User: root
       Comment: 
1 row in set (0.00 sec)
```

#### 3.3 Handle Errors During the Load

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Troubleshooting / Data quality errors -->

**Step 1**: Query failed load jobs. When a batch load contains multiple jobs, you can use the following statement to filter the labels and reasons of the failed jobs:

```SQL
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
           URL: http://10.16.10.6:28747/api/_load_error_log?file=__shard_2/error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342
    JobDetails: {"Unfinished backends":{"7602ccd7c3a4854-95307efca7bfe341":[]},"ScannedRows":4,"TaskNumber":1,"LoadBytes":188,"All backends":{"7602ccd7c3a4854-95307efca7bfe341":[10022]},"FileNumber":3,"FileSize":4839}
 TransactionId: 769213
  ErrorTablets: {}
          User: root
       Comment: 
```

**Step 2**: Interpret the error type. The example above is a **data quality error** (`ETL_QUALITY_UNSATISFIED`). Open the `URL` returned in the output to see the detailed error. For example, the error below indicates that the data exceeds the actual length of the `country` column defined in the schema:

```python
[root@VM-10-6-centos ~]$ curl "http://10.16.10.6:28747/api/_load_error_log?file=__shard_2/error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342"
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [USA] schema length: 1; actual length: 3; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Canada] schema length: 1; actual length: 6; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [UK] schema length: 1; actual length: 2; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Australia] schema length: 1; actual length: 9; . src line [];
```

**Step 3**: Set an error tolerance ratio (optional). If you can tolerate skipping some erroneous rows, set the error tolerance ratio in the `PROPERTIES` of the S3 Load. For details, see [Load Configuration Parameters](https://doris.apache.org/zh-CN/docs/dev/data-operate/import/import-way/broker-load-manual#导入配置参数).

#### 3.4 Load Multiple Partitions in Batches

When migrating large historical datasets, follow these guidelines for batch loading:

- Each batch should correspond to one Doris partition or a small number of partitions.
- The size of a single batch should not exceed **100 GB**, to reduce system pressure and lower the cost of retrying after a failed load.
- You can use the [s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh) script as a reference. It iterates over the partition directories on S3 and automatically submits S3 Load jobs to Doris for batch loading.

## FAQ

<!-- Knowledge type: FAQ -->

**Q1: Why can the Redshift TIME type not be loaded directly into Doris?**

Doris does not support the `TIME` type. When Redshift exports the `TIME/TIMEZ` type, you must use `CAST` to convert it to `VARCHAR` before exporting, and store it as `STRING` in Doris.

**Q2: Can S3 Load be used for Parquet/ORC files that contain complex types such as Struct/Array/Map?**

No. Currently, you must use [TVF Load](./amazon-s3.md#method-2-load-with-tvf-synchronous) for files that contain complex types.

**Q3: Is S3 Load synchronous or asynchronous? How can the result be queried?**

S3 Load is an **asynchronous** load method. After submitting the job, run `SHOW LOAD WHERE label = "<your_label>"` to check the progress and result.

**Q4: How should the `ETL_QUALITY_UNSATISFIED` error be handled?**

This error indicates that the data quality does not meet requirements. To handle it:

1. Open the `URL` returned in the `SHOW LOAD` output to retrieve the detailed error log.
2. Adjust the Doris table schema or the source data based on the error log (such as field length overflow or type mismatch).
3. If some erroneous rows are tolerable, adjust the `max_filter_ratio` error tolerance ratio in the `PROPERTIES` of the S3 Load.

**Q5: How can a one-shot load failure be avoided when migrating large data volumes?**

It is recommended to load data in batches by Doris partition, keep each batch under 100 GB, and use the [s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh) script to automate batch submission.
