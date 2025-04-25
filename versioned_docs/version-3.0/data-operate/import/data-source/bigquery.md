---
{
    "title": "BigQuery",
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

During the process of migrating BigQuery, it is usually necessary to use object storage as an intermediate medium. The core process is as follows: First, use BigQuery's [Export](https://cloud.google.com/bigquery/docs/exporting-data) statement to export data to GCS (Google Cloud Storage); then, use Doris's S3 Load function to read data from the object storage and load it into Doris. For details, please refer to [S3 Load](./amazon-s3.md).


## Considerations

1. Before the migration, it is necessary to select Doris' [Data Model](../../../table-design/data-model/overview.md), as well as the strategies for [Partitioning](../../../table-design/data-partitioning/dynamic-partitioning.md) and [Bucketing](../../../table-design/data-partitioning/data-bucketing.md) according to the table structure of BigQuery. For more table creation strategies, please refer to [Load Best Practices](../load-best-practices.md).
2. When BigQuery exports data in JSON type, it does not support exporting in Parquet format. You can export it in JSON format instead.
3. When BigQuery exports data of the Time type, it is necessary to export it after casting it to the String type.

## Data type mapping

| BigQuery           | Doris          | Comment                 |
| ------------------ | -------------- | -------------------- |
| Array              | Array          |                      |
| BOOLEAN            | BOOLEAN        |                      |
| DATE               | DATE           |                      |
| DATETIME/TIMESTAMP | DATETIME       |                      |
| JSON               | JSON           |                      |
| INT64              | BIGINT         |                      |
| NUMERIC            | DECIMAL        |                      |
| FLOAT64            | DOUBLE         |                      |
| STRING             | VARCHAR/STRING | VARCHAR maximum length is 65535 |
| STRUCT             | STRUCT         |                      |
| TIME               | STRING         |                      |
| OTHER              | UNSUPPORTED    |                      |

## 1. Create Table

When migrating a BigQuery table to Doris, it is necessary to create a Doris table first.

Suppose we already have the following table and data in BigQuery.

```SQL
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

According to this table structure, a Doris primary key partitioned table can be created. The partition field should be the same as that in BigQuery, and the table should be partitioned on a daily basis.

```sql
CREATE TABLE `sales_data` (
  order_id      INT,
  order_date    DATE NOT NULL,
  customer_name VARCHAR(128),
  amount        DECIMAL(10,2),
  country       VARCHAR(48)
) ENGINE=OLAP
UNIQUE KEY(`order_id`,`order_date`)
PARTITION BY RANGE(`order_date`) ()
DISTRIBUTED BY HASH(`order_id`) BUCKETS 16
PROPERTIES (
 "dynamic_partition.enable" = "true",
 "dynamic_partition.time_unit" = "DAY",
 "dynamic_partition.start" = "-10",
 "dynamic_partition.end" = "10",
 "dynamic_partition.prefix" = "p",
 "dynamic_partition.buckets" = "16",
 "replication_num" = "1"
);
```

## 2. Export BigQuery Data

2.1. **Export to GCS Parquet format file through Export method**

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
    
2.2. **View the exported files on GCS**

   The above command will export the data of sales_data to GCS, and each partition will generate one or more files with increasing file names. For details, please refer to [exporting-data](https://cloud.google.com/bigquery/docs/exporting-data#exporting_data_into_one_or_more_files), as follows:

   ![img](/images/data-operate/gcs_export.png)


## 3. Load Data to Doris

S3 Load is an asynchronous data load method. After execution, Doris actively pulls data from the data source. The data source supports object storage compatible with the S3 protocol, including ([AWS S3](./amazon-s3.md)，[GCS](./google-cloud-storage.md)，[AZURE](./azure-storage.md)，etc)

This method is suitable for scenarios involving large volumes of data that require asynchronous processing in the background. For data imports that need to be handled synchronously, refer to  [TVF Load](./amazon-s3.md#load-with-tvf)。

*Note: For **Parquet/ORC format files that contain complex types (Struct/Array/Map)**, TVF Load must be used.*

3.1. **Loading data from a single file**

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

3.3. **Handle Load Errors**

  When there are multiple load tasks, you can use the following statement to query the dates and reasons for data load failures.

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
             URL: http://10.16.10.6:28747/api/_load_error_log?file=__shard_2 error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342
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

   For data quality errors, if you want to allow skipping erroneous records, you can set a fault tolerance rate in the Properties section of the S3 Load task. For details, refer to [Load Configuration Parameters](../../import/import-way/broker-load-manual.md#related-configurations)。
  
3.4. **Loading data from multiple files**

   When migrating a large volume of historical data, it is recommended to use a batch load strategy. Each batch corresponds to one or a few partitions in Doris. It is recommended to keep the data size under 100GB per batch to reduce system load and lower the cost of retries in case of load failures.

   You can refer to the script [s3_load_file_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_file_demo.sh), which can split the file list under the specified directory on the object storage and submit multiple S3 Load tasks to Doris in batches to achieve the effect of batch load.
