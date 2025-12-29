---
{
    "title": "集成 Glue + AWS S3 Tables",
    "language": "zh-CN",
    "description": "AWS S3 Tables 是一种特殊的 S3 Bucket 类型，其对外提供 Apache Iceberg 表格式标准的读写接口，底层依托 Amazon S3，提供和 S3 本身相同的持久性、可用性、可扩展性和性能特征。此外，S3 Tables 还提供以下特性："
}
---

[AWS S3 Tables](https://aws.amazon.com/s3/features/tables/) 是一种特殊的 S3 Bucket 类型，其对外提供 Apache Iceberg 表格式标准的读写接口，底层依托 Amazon S3，提供和 S3 本身相同的持久性、可用性、可扩展性和性能特征。此外，S3 Tables 还提供以下特性：

- 与存储在普通 S3 Buckets 中的 Iceberg 表格式相比，S3 Tables 的查询性能最多可高 3 倍，每秒事务数最多可高 10 倍。
- 自动化的表格管理。S3 Tables 会自动回 Iceberg 表数据进行优化，包括小文件合并、快照管理、垃圾文件清理等。

S3 Tables 的发布，进一步简化 Lakehouse 的架构，并为云原生的湖仓系统带来更多想象空间。包括冷热分离、数据归档、数据备份、存算分离架构，都可能基于 S3 Tables 演化出全新的架构。

得益于 Amazon S3 Tables 对 Iceberg API 的高度兼容，Apache Doris 可以和 S3 Tables 进行快速对接。本文将演示如何使用 Apache Doris 对接 S3 Tables 并进行数据分析加工。

:::tip
该功能从 Doris 3.1 开始支持
:::

## 使用指南

### 01 创建 S3 Table Bucket

S3 Table Bucket 是 S3 推出的第三种 Bucket 类型，和之前的 General purpose bucket 以及 Directory bucket 平级。

![AWS S3 Table Bucket](/images/Lakehouse/s3-table-bucket.png)

这里我们创建一个名为 doris-s3-table-bucket 的 Table Bucket。创建后我们将得到一个 ARN 表示的 Table Bucket

![AWS S3 Table Bucket Create](/images/Lakehouse/s3-table-bucket-create.png)

### 02 创建 Iceberg Catalog

- 创建一个 `s3tables` 类型的 Iceberg Catalog

    ```sql
    CREATE CATALOG iceberg_s3 PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 's3tables',
        'warehouse' = 'arn:aws:s3tables:<region>:<acount_id>:bucket/<s3_table_bucket_name>',
        's3.region' = '<region>',
        's3.endpoint' = 's3.<region>.amazonaws.com',
        's3.access_key' = '<ak>',
        's3.secret_key' = '<sk>'
    );
    ```

- 通过 Glue Rest Catalog 连接 `s3 tables`

    ```sql
    CREATE CATALOG glue_s3 PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'https://glue.<region>.amazonaws.com/iceberg',
        'warehouse' = '<acount_id>:s3tablescatalog/<s3_table_bucket_name>',
        'iceberg.rest.sigv4-enabled' = 'true',
        'iceberg.rest.signing-name' = 'glue',
        'iceberg.rest.access-key-id' = '<ak>',
        'iceberg.rest.secret-access-key' = '<sk>',
        'iceberg.rest.signing-region' = '<region>'
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

我们可以再插入一批数据，然后使用 `$snapshots` 系统表查看 Iceberg 的 Snapshots：

```sql
Doris > INSERT INTO partition_table VALUES
    -> ("2024-01-03 08:00:00", 1000, "us-east", "PART1"),
    -> ("2024-01-04 10:00:00", 1002, "us-sout", "PART2");
Query OK, 2 rows affected (9.76 sec)
{'status':'COMMITTED', 'txnId':'1736935786474'}
```

```
Doris > SELECT * FROM partition_table$snapshots\G
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

