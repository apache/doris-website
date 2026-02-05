---
{
    "title": "Snowflake",
    "language": "zh-CN",
    "description": "在迁移 Snowflake 的过程中，通常需要借助对象存储作为中间媒介。核心流程如下：首先通过 Snowflake 的 COPY INTO 语句将数据导出到对象存储；再利用 Doris 的 S3 Load 功能从对象存储中读取数据并导入到 Doris 中，具体可参考 S3 导入。"
}
---

在迁移 Snowflake 的过程中，通常需要借助对象存储作为中间媒介。核心流程如下：首先通过 Snowflake 的 [COPY INTO](https://docs.snowflake.cn/zh/guides-overview-unloading-data) 语句将数据导出到对象存储；再利用 Doris 的 S3 Load 功能从对象存储中读取数据并导入到 Doris 中，具体可参考 [S3 导入](./amazon-s3.md)。

## 注意事项

在迁移之前，需要根据 Snowflake 的表结构选择 Doris 的[数据模型](../../../table-design/data-model/overview.md)，以及[分区](../../../table-design/data-partitioning/dynamic-partitioning.md)和[分桶](../../../table-design/data-partitioning/data-bucketing.md)的策略，更多创建表策略可参考[导入最佳实践](../load-best-practices.md)。

## 数据类型映射

| Snowflake                                        | Doris          | 备注                                               |
| ------------------------------------------------ | -------------- | -------------------------------------------------- |
| NUMBER(p, s)/DECIMAL(p, s)/NUMERIC(p,s)          | DECIMAL(p, s)  |                                                    |
| INT/INTEGER                                      | INT            |                                                    |
| TINYINT/BYTEINT                                  | TINYINT        |                                                    |
| SMALLINT                                         | SMALLINT       |                                                    |
| BIGINT                                           | BIGINT         |                                                    |
| FLOAT/FLOAT4/FLOAT8/DOUBLE/DOUBLE PRECISION/REAL | DOUBLE         |                                                    |
| VARCHAR/STRING/TEXT                              | VARCHAR/STRING | VARCHAR 长度最大 65535                               |
| CHAR/CHARACTER/NCHAR                             | CHAR           |                                                    |
| BINARY/VARBINARY                                 | STRING         |                                                    |
| BOOLEAN                                          | BOOLEAN        |                                                    |
| DATE                                             | DATE           |                                                    |
| DATETIME/TIMESTAMP/TIMESTAMP_NTZ                 | DATETIME       | TIMESTAMP 是用户可配置的别名，默认为 TIMESTAMP_NTZ |
| TIME                                             | STRING         | Snowflake 导出时需要 Cast 成 String 类型                |
| VARIANT                                          | VARIANT        |                                                    |
| ARRAY                                            | ARRAY<T>       |                                                    |
| OBJECT                                           | JSON           |                                                    |
| GEOGRAPHY/GEOMETRY                               | STRING         |                                                    |

## 1. 创建表

在迁移 Snowflake 表到 Doris 中的时候，需要先创建 Doris 表。

假设我们在 Snowflake 中已存在如下表和数据

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

根据这个表结构，可以创建 Doris 主键分区表，分区字段和 Snowflake 的 Clustering Key 一致，同时按天分区

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

## 2. 导出 Snowflake 数据

2.1. **通过 COPY INFO 方式导出到 S3 Parquet 格式的文件**

   Snowflake 支持导出到 [AWS S3](https://docs.snowflake.com/en/user-guide/data-unload-s3)，[GCS](https://docs.snowflake.com/en/user-guide/data-unload-gcs)，[AZURE](https://docs.snowflake.com/en/user-guide/data-unload-azure)，导出时，建议按照**Doris 的分区字段**进行导出。以下为导出到 AWS S3 的示例：

   ```sql
   CREATE FILE FORMAT my_parquet_format TYPE = parquet;   
   CREATE OR REPLACE STAGE external_stage
   URL='s3://mybucket/sales_data'
   CREDENTIALS=(AWS_KEY_ID='<ak>' AWS_SECRET_KEY='<sk>')
   FILE_FORMAT = my_parquet_format;   
   COPY INTO @external_stage from sales_data PARTITION BY (CAST(order_date AS VARCHAR)) header=true;
   ```

2.2. **查看 S3 上的导出文件**

   导出后，在 S3 上会按照**分区划分成具体的子目录**，每一个目录是对应的 如下

​   ![snowflake_s3_out](/images/data-operate/snowflake_s3_out.png)

​   ![snowflake_s3_out2](/images/data-operate/snowflake_s3_out2.png)

## 3. 导入数据到 Doris

导入使用 S3 Load 进行导入，**S3 Load 是一种异步的数据导入方式，执行后 Doris 会主动从数据源拉取数据，**数据源支持兼容 S3 协议的对象存储，包括 ([AWS S3](./amazon-s3.md)，[GCS](./google-cloud-storage.md)，[AZURE](./azure-storage.md)等)。

该方式适用于数据量大、需要后台异步处理的场景。对于需要同步处理的数据导入，可以参考 [TVF 导入](./amazon-s3.md#load-with-tvf)。

*注意：对于**含有**复杂类型（Struct/Array/Map）的**Parquet/ORC格式文件**导入，目前必须使用 TVF 导入*

3.1. **导入一个分区的数据**

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

3.2. **通过 Show Load 查看任务运行情况**

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

3.3. **处理导入过程中的错误**

   当有多个导入任务时，可以通过以下语句，查询数据导入失败的日期和原因。

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
           URL: http://10.16.10.6:28747/api/_load_error_log?file=__shard_2   error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342
       JobDetails: {"Unfinished backends":{"7602ccd7c3a4854-95307efca7bfe341":[]},"ScannedRows":4,"TaskNumber":1,"LoadBytes":188,"All   backends":{"7602ccd7c3a4854-95307efca7bfe341":[10022]},"FileNumber":3,"FileSize":4839}
   TransactionId: 769213
   ErrorTablets: {}
           User: root
       Comment: 
   ```

   如上面的例子是**数据质量错误**(ETL_QUALITY_UNSATISFIED)，具体错误需要通过访问返回的 URL 的链接进行查看，如下是数据超过了表中的 Schema 中 country 列的实际长度：

   ```python
   [root@VM-10-6-centos ~]$ curl "http://10.16.10.6:28747/api/_load_error_log?file=__shard_2   error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342"
   Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [USA] schema length: 1; actual   length: 3; . src line []; 
   Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Canada] schema length: 1; actual   length: 6; . src line []; 
   Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [UK] schema length: 1; actual   length: 2; . src line []; 
   Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Australia] schema length: 1;   actual length: 9; . src line [];
   ```

   同时对于数据质量的错误，如果可以允许错误数据跳过的，可以通过在 S3 Load 任务中 Properties 设置容错率，具体可参考[导入配置参数](../../import/import-way/broker-load-manual.md#related-configurations)。

3.4. **导入多个分区的数据**

   当需要迁移大数据量的存量数据时，建议使用分批导入的策略。每批数据对应 Doris 的一个分区或少量几个分区，数据量建议不超过 100GB，以减轻系统压力并降低导入失败后的重试成本。

   可参考脚本 [s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh)，该脚本可以实现了轮询 S3 上的分区目录，同时提交 S3 Load 任务到 Doris 中，实现批量导入的效果。