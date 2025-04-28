---
{
    "title": "Snowflake",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

During the migration from Snowflake to Doris, object storage is typically used as an intermediate medium. The core process is as follows: First, export data to object storage using Snowflake's [COPY INTO](https://docs.snowflake.com/en/user-guide/data-unload-overview) statement. Then, use Doris' S3 Load feature to read data from the object storage and load it into Doris. For details, refer to [S3 Load](./amazon-s3.md).


## Considerations

Before migration, select Doris' [data model](../../../table-design/data-model/overview.md), [partitioning](../../../table-design/data-partitioning/dynamic-partitioning.md), and [bucketing](../../../table-design/data-partitioning/data-bucketing.md) strategies based on Snowflake's table structure. For more table creation strategies, refer to [Load Best Practices](../load-best-practices.md).

## Data type mapping

| Snowflake                                        | Doris          | Comment                                            |
| ------------------------------------------------ | -------------- | -------------------------------------------------- |
| NUMBER(p, s)/DECIMAL(p, s)/NUMERIC(p,s)          | DECIMAL(p, s)  |                                                    |
| INT/INTEGER                                      | INT            |                                                    |
| TINYINT/BYTEINT                                  | TINYINT        |                                                    |
| SMALLINT                                         | SMALLINT       |                                                    |
| BIGINT                                           | BIGINT         |                                                    |
| FLOAT/FLOAT4/FLOAT8/DOUBLE/DOUBLE PRECISION/REAL | DOUBLE         |                                                    |
| VARCHAR/STRING/TEXT                              | VARCHAR/STRING | VARCHAR maximum length is 65535                    |
| CHAR/CHARACTER/NCHAR                             | CHAR           |                                                    |
| BINARY/VARBINARY                                 | STRING         |                                                    |
| BOOLEAN                                          | BOOLEAN        |                                                    |
| DATE                                             | DATE           |                                                    |
| DATETIME/TIMESTAMP/TIMESTAMP_NTZ                 | DATETIME       | TIMESTAMP is a configurable alias (default: TIMESTAMP_NTZ) |
| TIME                                             | STRING         | Cast to String when exporting from Snowflake                |
| VARIANT                                          | VARIANT        |                                                    |
| ARRAY                                            | ARRAY<T>       |                                                    |
| OBJECT                                           | JSON           |                                                    |
| GEOGRAPHY/GEOMETRY                               | STRING         |                                                    |

## 1. Create Table

To migrate a Snowflake table to Doris, first create the Doris table.

Assume we have the following table and data in Snowflake:

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
(1, 'Alice', '2025-04-08', 99.99, 'USA'),
(2, 'Bob', '2025-04-08', 149.50, 'Canada'),
(3, 'Charlie', '2025-04-09', 75.00, 'UK'),
(4, 'Diana', '2025-04-10', 200.00, 'Australia');
```

Based on this structure, create a Doris Primary Key partitioned table aligned with Snowflake's clustering key, partitioned by day:

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

## 2. Export Data from Snowflake

2.1. **Export to S3 Parquet Files via COPY INTO**

    Snowflake supports exporting to [AWS S3](https://docs.snowflake.com/en/user-guide/data-unload-s3)，[GCS](https://docs.snowflake.com/en/user-guide/data-unload-gcs)，[AZURE](https://docs.snowflake.com/en/user-guide/data-unload-azure)，**Export data partitioned by Doris' partition fields**. Example for AWS S3:

    ```sql
    CREATE FILE FORMAT my_parquet_format TYPE = parquet;

    CREATE OR REPLACE STAGE external_stage
    URL='s3://mybucket/sales_data'
    CREDENTIALS=(AWS_KEY_ID='<ak>' AWS_SECRET_KEY='<sk>')
    FILE_FORMAT = my_parquet_format;

    COPY INTO @external_stage from sales_data PARTITION BY (CAST(order_date AS VARCHAR)) header=true;
    ```

2.2. **Verify Exported Files on S3**

    Exported files are organized into **subdirectories by partition** on S3:

    ![img](/images/data-operate/snowflake_s3_out_en.png)

    ![img](/images/data-operate/snowflake_s3_out2_en.png)

## 3. Load Data to Doris

S3 Load is an asynchronous data load method. After execution, Doris actively pulls data from the data source. The data source supports object storage compatible with the S3 protocol, including ([AWS S3](./amazon-s3.md)，[GCS](./google-cloud-storage.md)，[AZURE](./azure-storage.md)，etc)

This method is suitable for scenarios involving large volumes of data that require asynchronous processing in the background. For data imports that need to be handled synchronously, refer to  [TVF Load](./amazon-s3.md#load-with-tvf)。

*Note: For **Parquet/ORC format files that contain complex types (Struct/Array/Map)**, TVF Load must be used.*

3.1. **Load a Single Partition**

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

3.2. **Check Load Status via SHOW LOAD**

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

3.3. **Handle Load Errors**

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

3.4. **Load data for multiple partitions**

   When migrating a large volume of historical data, it is recommended to use a batch load strategy. Each batch corresponds to one or a few partitions in Doris. It is recommended to keep the data size under 100GB per batch to reduce system load and lower the cost of retries in case of load failures.

   You can refer to the script [s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh), which can poll the partition directory on S3 and submit the S3 Load task to Doris to achieve batch load.