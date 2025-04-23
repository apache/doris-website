---
{
    "title": "BigQuery",
    "language": "zh-CN"
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

在迁移 BigQuery 的过程中，通常需要借助对象存储作为中间媒介。核心流程如下：首先通过 BigQuery 的 [Export](https://cloud.google.com/bigquery/docs/exporting-data) 语句将数据导出到 GCS（Google Cloud Storage）；再利用 Doris 的 S3 Load 功能从对象存储中读取数据并导入到 Doris 中，具体可参考 [S3 导入](./amazon-s3.md)。

## 注意事项

1. 在迁移之前，需要根据 BigQuery 的表结构选择 Doris 的[数据模型](../../../table-design/data-model/overview.md)，以及[分区](../../../table-design/data-partitioning/dynamic-partitioning.md)和[分桶](../../../table-design/data-partitioning/data-bucketing.md)的策略，更多创建表策略可参考[导入最佳实践](../load-best-practices.md)。
2. BigQuery 导出 JSON 类型时，不支持 Parquet 格式导出，可使用 JSON 格式导出。
3. BigQuery 导出 Time 类型时，需要 Cast String 类型导出。

## 数据类型映射

| BigQuery           | Doris          | 备注                 |
| ------------------ | -------------- | -------------------- |
| Array              | Array          |                      |
| BOOLEAN            | BOOLEAN        |                      |
| DATE               | DATE           |                      |
| DATETIME/TIMESTAMP | DATETIME       |                      |
| JSON               | JSON           |                      |
| INT64              | BIGINT         |                      |
| NUMERIC            | DECIMAL        |                      |
| FLOAT64            | DOUBLE         |                      |
| STRING             | VARCHAR/STRING | VARCHAR 长度最大 65535 |
| STRUCT             | STRUCT         |                      |
| TIME               | STRING         |                      |
| OTHER              | UNSUPPORTED    |                      |

## 1. 创建表

在迁移 BigQuery 表到 Doris 中的时候，需要先创建 Doris 表。

假设我们在 BigQuery 中已存在如下表和数据

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

根据这个表结构，可以创建 Doris 主键分区表，分区字段和 Bigquery 的分区字段一致，同时按天分区

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

## 2. 导出 BigQuery 数据

1. **通过 Export 方式导出到 GCS Parquet 格式的文件**
   导出到 GCS 时，建议按照**Doris 的 Partition 字段**进行导出。

   a. **导出单分区的数据**
      ```sql
        EXPORT DATA
          OPTIONS (
            uri = 'gs://mybucket/2025-04-08/*.parquet',
            format = 'PARQUET')
        AS (
          SELECT *
          FROM test.sales_data 
          where order_date = '2025-04-08'
        );
      ```

   b. **导出多分区的数据**
   
    对于分区和数据量都比较少的表，可以直接将整个表导出，BigQuery 默认会对每个分区生成一个或多个文件。
    
    对于分区较多的表，可以在[BigQuery 笔记本](https://cloud.google.com/bigquery/docs/notebooks-introduction)中执行以下脚本，可以批量导出表并以分区形式写入到 GCS 上。
    
    ```python
    # Description:
    # Can export the specified table to gcs by date partition
    from google.cloud import bigquery
    from datetime import datetime, timedelta
    
    client = bigquery.Client()
    
    dataset = "test"
    table_name = "sales_data"
    export_path_prefix = "gs://mybucket/sales_data"
    # Specify the start and end date partition (format: yyyy-mm-dd)
    start_str = "2025-04-08"
    end_str = "2025-04-10"
    
    start_date = datetime.strptime(start_str, "%Y-%m-%d")
    end_date = datetime.strptime(end_str, "%Y-%m-%d")
    
    # Iterate over a date range
    current_date = start_date
    while current_date <= end_date:
        # For table decorators, BigQuery requires partition IDs to be YYYYMMDD
        partition_for_table = current_date.strftime("%Y%m%d")
        partition_for_dir = current_date.strftime("%Y-%m-%d")
    
        # Construct tableId, data set name is test, table name is sales_data
        table_id = f"{dataset}.{table_name}${partition_for_table}"
        destination_uri = f"{export_path_prefix}/{partition_for_dir}/part-*.parquet"
        job_config = bigquery.ExtractJobConfig(
            destination_format="PARQUET"
        )
    
        try:
            # Initiate an export task
            extract_job = client.extract_table(
                table_id,
                destination_uri,
                job_config=job_config
            )
            extract_job.result()  # Wait for the task to complete
            print(f"Successfully exported partition {partition_for_table} to {destination_uri}")
    
        except Exception as e:
            # When a partition does not exist or a task fails, an error message is output
            print(f"Exporting partition {partition_for_table} failed:{e}")
    
        # Continue to the next partition
        current_date += timedelta(days=1)
    ```

  ​		运行结果如下：

  ​	![img](/images/data-operate/bigquery_notebook.png)

2. **查看 GCS 上的导出文件**

  导出后，在 GCS 上会按照**分区划分成具体的子目录**，如下

  ![img](/images/data-operate/gcs_export.png)

## 3. 导入数据到 Doris

导入使用 S3 Load 进行导入，**S3 Load 是一种异步的数据导入方式，执行后 Doris 会主动从数据源拉取数据**，数据源支持兼容 S3 协议的对象存储，包括 ([AWS S3](./amazon-s3.md)，[GCS](./google-cloud-storage.md)，[AZURE](./azure-storage.md)等)。

该方式适用于数据量大、需要后台异步处理的场景。对于需要同步处理的数据导入，可以参考 [TVF 导入](./amazon-s3.md#load-with-tvf)。

*注意：对于含有复杂类型（Struct/Array/Map）的 Parquet/ORC 格式文件导入，目前必须使用 TVF 导入*

1. **导入一个分区的数据**

  ```sql
  LOAD LABEL sales_data_2025_04_08
  (
      DATA INFILE("s3://mybucket/sales_data/2025-04-08/*")
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

2. **通过 Show Load 查看任务运行情况**

  由于 S3Load 导入是异步提交的，所以需要通过 show load 可以查看指定 label 的导入情况：

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

3. **处理导入过程中的错误**

  当有多个导入任务时，可以通过以下语句，查询数据导入失败的日期和原因。

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

  如上面的例子是**数据质量错误**(ETL_QUALITY_UNSATISFIED)，具体错误需要通过访问返回的 URL 的链接进行查看，如下是数据超过了表中的 Schema 中 country 列的实际长度：

  ```python
  [root@VM-10-6-centos ~]$ curl "http://10.16.10.6:28747/api/_load_error_log?file=__shard_2/error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342"
  Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [USA] schema length: 1; actual length: 3; . src line []; 
  Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Canada] schema length: 1; actual length: 6; . src line []; 
  Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [UK] schema length: 1; actual length: 2; . src line []; 
  Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Australia] schema length: 1; actual length: 9; . src line [];
  ```

  同时对于数据质量的错误，如果可以允许错误数据跳过的，可以通过在 S3 Load 任务中 Properties 设置容错率，具体可参考[导入配置参数](../../import/import-way/broker-load-manual.md#related-configurations)。

4. **导入多个分区的数据**

  当需要迁移大数据量的存量数据时，建议使用分批导入的策略。每批数据对应 Doris 的一个分区或少量几个分区，数据量建议不超过 100GB，以减轻系统压力并降低导入失败后的重试成本。

  可参考脚本 [s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh)，该脚本可以实现了轮询 S3 上的分区目录，同时提交 S3 Load 任务到 Doris 中，实现批量导入的效果。