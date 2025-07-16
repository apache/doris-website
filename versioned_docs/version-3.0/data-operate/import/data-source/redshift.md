---
{
    "title": "Redshift",
    "language": "en"
}
---

During the process of migrating Redshift, it is usually necessary to use object storage as an intermediate medium. The core process is as follows: First, use the [UNLOAD](https://docs.aws.amazon.com/zh_cn/redshift/latest/dg/r_UNLOAD.html) statement of Redshift to export data to the object storage; then, use the S3 Load function of Doris to read data from the object storage and import it into Doris. For details, please refer to [S3 Load](./amazon-s3.md)。

## Considerations

1. Before the migration, it is necessary to select Doris' [Data Model](../../../table-design/data-model/overview.md), as well as the strategies for [Partitioning](../../../table-design/data-partitioning/dynamic-partitioning.md) and [Bucketing](../../../table-design/data-partitioning/data-bucketing.md) according to the table structure of Redshift. For more table creation strategies, please refer to [Load Best Practices](../load-best-practices.md).
2. When Redshift exports data of the Time type, it is necessary to export it after casting it to the Varchar type.
   

## Data type mapping

| Redshift         | Doris          | Comment                 |
| ---------------- | -------------- | -------------------- |
| SMALLINT         | SMALLINT       |                      |
| INTEGER          | INT            |                      |
| BIGINT           | BIGINT         |                      |
| DECIMAL          | DECIMAL        |                      |
| REAL             | FLOAT          |                      |
| DOUBLE PRECISION | DOUBLE         |                      |
| BOOLEAN          | BOOLEAN        |                      |
| CHAR             | CHAR           |                      |
| VARCHAR          | VARCHAR/STRING | VARCHAR maximum length is 65535 |
| DATE             | DATE           |                      |
| TIMESTAMP        | DATETIME       |                      |
| TIME/TIMEZ       | STRING         |                      |
| SUPER            | VARIANT        |                      |
| OTHER            | UNSUPPORTED    |                      |

## 1. Create Table

To migrate a Redshift table to Doris, first create the Doris table.

Assume we have the following table and data in Redshift:

```SQL
CREATE TABLE sales_data (
    order_id      INTEGER,
    customer_name VARCHAR(128),
    order_date    DATE,
    amount        DECIMAL(10,2),
    country       VARCHAR(48)
)
DISTSTYLE AUTO

INSERT INTO sales_data VALUES
(1, 'Alice', '2025-04-08', 99.99, 'USA'),
(2, 'Bob', '2025-04-08', 149.50, 'Canada'),
(3, 'Charlie', '2025-04-09', 75.00, 'UK'),
(4, 'Diana', '2025-04-10', 200.00, 'Australia');
```

According to this table structure, a Doris primary key partitioned table can be created. The partition field should be selected according to the business scenario. Here, the partition field is "order_date", and it is partitioned on a daily basis.

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

## 2. Export Data from Redshift

**2.1 Export to S3 Parquet Files via UNLOAD**

When exporting to S3, export according to the **Partition field of Doris**, as follows:

```sql
unload ('select * from sales_data')
to 's3://mybucket/redshift/sales_data/'
iam_role 'arn:aws:iam::0123456789012:role/MyRedshiftRole'
PARQUET
PARTITION BY (order_date) INCLUDE
```

**2.2 Verify Exported Files on S3**

Exported files are organized into **subdirectories by partition** on S3:

![redshift_out](/images/data-operate/redshift_out.png)

![redshift_out2](/images/data-operate/redshift_out2.png)

## 3. Load Data to Doris

S3 Load is an asynchronous data load method. After execution, Doris actively pulls data from the data source. The data source supports object storage compatible with the S3 protocol, including ([AWS S3](./amazon-s3.md)，[GCS](./google-cloud-storage.md)，[AZURE](./azure-storage.md)，etc)

This method is suitable for scenarios involving large volumes of data that require asynchronous processing in the background. For data imports that need to be handled synchronously, refer to  [TVF Load](./amazon-s3.md#load-with-tvf)。

*Note: For **Parquet/ORC format files that contain complex types (Struct/Array/Map)**, TVF Load must be used.*

**3.1 Load a Single Partition**

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

**3.2 Check Load Status via SHOW LOAD**

 Since S3 Load import is submitted asynchronously, you can check the status of a specific label using SHOW LOAD:

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
    JobDetails: {"Unfinished backends":{"5eec1be8612d4872-91040ff1e7208a4f":[]},"ScannedRows":2,"TaskNumber":1,"LoadBytes":91,"All backends":{"5eec1be8612d4872-91040ff1e7208a4f":[10022]},"FileNumber":1,"FileSize":1620}
 TransactionId: 766228
  ErrorTablets: {}
          User: root
       Comment: 
1 row in set (0.00 sec)
```

**3.3 Handle Load Errors**

 When there are multiple load tasks, you can use the following statement to query the dates and reasons for data load failures.

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

 As shown in the example above, the issue is a **data quality error**(ETL_QUALITY_UNSATISFIED). To view the detailed error, you need to visit the URL provided in the result. For example, the data exceeded the defined length of the country column in the table schema:

```python
[root@VM-10-6-centos ~]$ curl "http://10.16.10.6:28747/api/_load_error_log?file=__shard_2/error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342"
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [USA] schema length: 1; actual length: 3; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Canada] schema length: 1; actual length: 6; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [UK] schema length: 1; actual length: 2; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Australia] schema length: 1; actual length: 9; . src line [];
```

 For data quality errors, if you want to allow skipping erroneous records, you can set a fault tolerance rate in the Properties section of the S3 Load task. For details, refer to [Import Configuration Parameters](../../import/import-way/broker-load-manual.md#related-configurations)。

**3.4 Load data for multiple partitions**

 When migrating a large volume of historical data, it is recommended to use a batch load strategy. Each batch corresponds to one or a few partitions in Doris. It is recommended to keep the data size under 100GB per batch to reduce system load and lower the cost of retries in case of load failures.

 You can refer to the script [s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh), which can poll the partition directory on S3 and submit the S3 Load task to Doris to achieve batch load.