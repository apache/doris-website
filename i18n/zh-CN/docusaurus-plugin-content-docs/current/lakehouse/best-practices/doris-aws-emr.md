---
{
    "title": "集成 AWS EMR",
    "language": "zh-CN",
    "description": "本文主要介绍如何通过 Doris 快速集成 Amazon EMR，并以访问 Hive 为例，展示和 AWS Glue Data Catalog 以及和 Amazon S3 的集成。"
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

本文主要介绍如何通过 Doris 快速集成 [Amazon EMR](https://aws.amazon.com/cn/emr/)，并以访问 Hive 为例，展示和 [AWS Glue Data Catalog](https://docs.aws.amazon.com/prescriptive-guidance/latest/serverless-etl-aws-glue/aws-glue-data-catalog.html) 以及和 [Amazon S3](https://aws.amazon.com/s3) 的集成。

## 环境准备

### 01 创建 Amazon EMR 集群

首先，您需要拥有一个 AWS EMR 集群，并包含必要的组件如 Hive、Hadoop。可以选择是否使用 AWS Glue Data Catalog。Doris 支持访问 Glue 元数据服务，或默认的 Hive Metastore 元数据服务。

### 02 确认网络安全组

按需修改 EMR Master/Core/Task 节点的网络安全组入站规则，确保 Doris 所在节点，允许访问对应服务的端口，如 Hive Metastore 的 Thrift 端口，HDFS 的 Namenode 以及 Datanode 端口等。

## 集成 EMR

这里我们以访问 EMR Hive 为例，介绍 Doris 和 EMR 的集成方式。

### 01 创建 Hive Catalog

这是一个基础的 Hive Catalog 创建示例：

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://<EMR_MASTER_IP>:9083'
);
```

如果 Hive 中有数据存储在 S3 上，则需添加 S3 连接认证信息：

```sql
CREATE CATALOG hive_catalog_s3 PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://<EMR_MASTER_IP>:9083',
    's3.endpoint' = 's3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = '<YOUR_ACCESS_KEY>',
    's3.secret_key' = '<YOUR_SECRET_KEY>'
);
```

如果使用了 Glue Data Catalog，则需添加 Glue 连接认证信息：

```sql
CREATE CATALOG glue_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.type' = 'glue',
    'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
    'glue.access_key' = '<YOUR_ACCESS_KEY>',
    'glue.secret_key' = '<YOUR_SECRET_KEY>'
);
```

S3 Table Bucket 是 S3 推出的第三种 Bucket 类型，和之前的 General purpose bucket 以及 Directory bucket 平级。

![AWS S3 Table Bucket](/images/Lakehouse/s3-table-bucket.png)

这里我们创建一个名为 doris-s3-table-bucket 的 Table Bucket。创建后我们将得到一个 ARN 表示的 Table Bucket

![AWS S3 Table Bucket Create](/images/Lakehouse/s3-table-bucket-create.png)

### 02 创建 Iceberg Catalog

创建一个 `s3tables` 类型的 Iceberg Catalog

```sql
CREATE CATALOG iceberg_s3 PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 's3tables',
    'warehouse' = 'arn:aws:s3tables:us-east-1:169698000000:bucket/doris-s3-table-bucket',
    's3.region' = 'us-east-1',
    's3.endpoint' = 's3.us-east-1.amazonaws.com',
    's3.access_key' = 'AKIASPAWQE3ITEXAMPLE',
    's3.secret_key' = 'l4rVnn3hCmwEXAMPLE/lht4rMIfbhVfEXAMPLE'
);
```

### 03 访问 S3Tables

```sql
Doris > SWITCH iceberg_s3;

Doris > SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| my_namespace       |
| mysql              |
+--------------------+

Doris > USE my_namespace;

Doris > SHOW TABLES;
+------------------------+
| Tables_in_my_namespace |
+------------------------+
| my_table               |
+------------------------+

Doris > SELECT * FROM my_table;
+------+------+-------+
| id   | name | value |
+------+------+-------+
|    1 | ABC  |   100 |
|    2 | XYZ  |   200 |
+------+------+-------+
```

### 04 创建 S3Tables 表并写入数据

```sql
Doris > CREATE TABLE partition_table (
    ->   `ts` DATETIME COMMENT 'ts',
    ->   `id` INT COMMENT 'col1',
    ->   `pt1` STRING COMMENT 'pt1',
    ->   `pt2` STRING COMMENT 'pt2'
    -> )
    -> PARTITION BY LIST (day(ts), pt1, pt2) ();

Doris > INSERT INTO partition_table VALUES
    -> ("2024-01-01 08:00:00", 1000, "us-east", "PART1"),
    -> ("2024-01-02 10:00:00", 1002, "us-sout", "PART2");
Query OK, 2 rows affected
{'status':'COMMITTED', 'txnId':'1736935786473'}

Doris > SELECT * FROM partition_table;
+----------------------------+------+---------+-------+
| ts                         | id   | pt1     | pt2   |
+----------------------------+------+---------+-------+
| 2024-01-02 10:00:00.000000 | 1002 | us-sout | PART2 |
| 2024-01-01 08:00:00.000000 | 1000 | us-east | PART1 |
+----------------------------+------+---------+-------+
```

### 05 Time Travel

我们可以再插入一批数据，然后使用 `iceberg_meta()` 函数查看 Iceberg 的 Snapshots：

```sql
Doris > INSERT INTO partition_table VALUES
    -> ("2024-01-03 08:00:00", 1000, "us-east", "PART1"),
    -> ("2024-01-04 10:00:00", 1002, "us-sout", "PART2");
Query OK, 2 rows affected (9.76 sec)
{'status':'COMMITTED', 'txnId':'1736935786474'}
```

```
Doris > SELECT * FROM iceberg_meta(
    ->     'table' = 'iceberg_s3.my_namespace.partition_table',
    ->     'query_type' = 'snapshots'
    -> )\G
*************************** 1. row ***************************
 committed_at: 2025-01-15 23:27:01
  snapshot_id: 6834769222601914216
    parent_id: -1
    operation: append
manifest_list: s3://80afcb3f-6edf-46f2-7fhehwj6cengfwc7n6iz7ipzakd7quse1b--table-s3/metadata/snap-6834769222601914216-1-a6b2230d-fc0d-4c1d-8f20-94bb798f27b1.avro
      summary: {"added-data-files":"2","added-records":"2","added-files-size":"5152","changed-partition-count":"2","total-records":"2","total-files-size":"5152","total-data-files":"2","total-delete-files":"0","total-position-deletes":"0","total-equality-deletes":"0","iceberg-version":"Apache Iceberg 1.6.1 (commit 8e9d59d299be42b0bca9461457cd1e95dbaad086)"}
*************************** 2. row ***************************
 committed_at: 2025-01-15 23:30:00
  snapshot_id: 5670090782912867298
    parent_id: 6834769222601914216
    operation: append
manifest_list: s3://80afcb3f-6edf-46f2-7fhehwj6cengfwc7n6iz7ipzakd7quse1b--table-s3/metadata/snap-5670090782912867298-1-beeed339-be96-4710-858b-f39bb01cc3ff.avro
      summary: {"added-data-files":"2","added-records":"2","added-files-size":"5152","changed-partition-count":"2","total-records":"4","total-files-size":"10304","total-data-files":"4","total-delete-files":"0","total-position-deletes":"0","total-equality-deletes":"0","iceberg-version":"Apache Iceberg 1.6.1 (commit 8e9d59d299be42b0bca9461457cd1e95dbaad086)"}
```

使用 `VERSION AS OF` 语法查询不同的快照：

```sql
Doris > SELECT * FROM partition_table FOR VERSION AS OF 5670090782912867298;
+----------------------------+------+---------+-------+
| ts                         | id   | pt1     | pt2   |
+----------------------------+------+---------+-------+
| 2024-01-04 10:00:00.000000 | 1002 | us-sout | PART2 |
| 2024-01-03 08:00:00.000000 | 1000 | us-east | PART1 |
| 2024-01-01 08:00:00.000000 | 1000 | us-east | PART1 |
| 2024-01-02 10:00:00.000000 | 1002 | us-sout | PART2 |
+----------------------------+------+---------+-------+

Doris > SELECT * FROM partition_table FOR VERSION AS OF 6834769222601914216;
+----------------------------+------+---------+-------+
| ts                         | id   | pt1     | pt2   |
+----------------------------+------+---------+-------+
| 2024-01-02 10:00:00.000000 | 1002 | us-sout | PART2 |
| 2024-01-01 08:00:00.000000 | 1000 | us-east | PART1 |
+----------------------------+------+---------+-------+
```

### 06 使用 EMR Spark 访问 S3 Tables

使用 Doris 写入的数据，也可以使用 Spark 进行访问：

```shell
spark-shell --jars /usr/share/aws/iceberg/lib//iceberg-spark-runtime-3.5_2.12-1.6.1-amzn-1.jar \
--packages software.amazon.s3tables:s3-tables-catalog-for-iceberg-runtime:0.1.3 \
--conf spark.sql.catalog.s3tablesbucket=org.apache.iceberg.spark.SparkCatalog \
--conf spark.sql.catalog.s3tablesbucket.catalog-impl=software.amazon.s3tables.iceberg.S3TablesCatalog \
--conf spark.sql.catalog.s3tablesbucket.warehouse=arn:aws:s3tables:us-east-1:169698000000:bucket/doris-s3-table-bucket \
--conf spark.sql.defaultCatalog=s3tablesbucket \
--conf spark.sql.extensions=org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions
```

```sql
scala> spark.sql("SELECT * FROM s3tablesbucket.my_namespace.`partition_table` ").show()
+-------------------+----+-------+-----+
|                 ts|  id|    pt1|  pt2|
+-------------------+----+-------+-----+
|2024-01-02 10:00:00|1002|us-sout|PART2|
|2024-01-01 08:00:00|1000|us-east|PART1|
|2024-01-04 10:00:00|1002|us-sout|PART2|
|2024-01-03 08:00:00|1000|us-east|PART1|
+-------------------+----+-------+-----+
```

