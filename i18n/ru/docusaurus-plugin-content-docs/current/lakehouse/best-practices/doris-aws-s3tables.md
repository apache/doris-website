---
{
    "title": "Интеграция с Glue + AWS S3 Tables",
    "language": "ru",
    "description": "AWS S3 Tables — это особый тип бакета S3, предоставляющий интерфейсы чтения и записи, совместимые со стандартами формата таблиц Apache Iceberg,"
}
---

[AWS S3 Tables](https://aws.amazon.com/s3/features/tables/) — это особый тип бакета S3, предоставляющий интерфейсы чтения и записи, совместимые со стандартами формата таблиц Apache Iceberg. Он построен на базе Amazon S3 и обладает теми же характеристиками сохранности данных, доступности, масштабируемости и производительности, что и сам S3. Кроме того, S3 Tables предоставляет следующие возможности:

- По сравнению с таблицами Iceberg, хранящимися в обычных бакетах S3, S3 Tables может обеспечить до 3 раз более высокую производительность запросов и до 10 раз больше транзакций в секунду.
- Автоматическое управление таблицами. S3 Tables автоматически оптимизирует данные таблиц Iceberg, включая компакцию небольших файлов, управление снимками и очистку ненужных файлов.

Появление S3 Tables ещё больше упрощает архитектуру Lakehouse и открывает новые возможности для систем озёр и хранилищ данных, изначально спроектированных для облака. Это касается архитектур с разделением холодных и горячих данных, архивированием данных, резервным копированием и разделением вычислительных ресурсов и хранения данных. На основе S3 Tables все они могут развиться в совершенно новые архитектуры.

Благодаря высокой совместимости Amazon S3 Tables с Iceberg API Apache Doris можно быстро интегрировать с S3 Tables. В этой статье показано, как подключить Apache Doris к S3 Tables и выполнять анализ и обработку данных.

:::tip
Эта функция поддерживается начиная с Doris 3.1
:::

## Руководство по использованию {#usage-guide}

### 01 Создание S3 Table Bucket {#01-create-s3-table-bucket}

S3 Table Bucket — третий тип бакета в S3 наряду с ранее представленными General purpose bucket и Directory bucket.

![AWS S3 Table Bucket](/images/Lakehouse/s3-table-bucket.png)

В этом примере мы создаём Table Bucket с именем doris-s3-table-bucket. После создания получаем Table Bucket, обозначенный идентификатором ARN.

![Создание AWS S3 Table Bucket](/images/Lakehouse/s3-table-bucket-create.png)

### 02 Создание Iceberg Catalog {#02-create-iceberg-catalog}

- Подключение к `s3 tables` с помощью AWS S3 Table Rest Catalog

    ```sql
    CREATE CATALOG aws_s3_tables PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'warehouse' = 'arn:aws:s3tables:us-east-1:<account_id>:bucket/<s3_table_bucket_name>',
        'iceberg.rest.uri' = 'https://s3tables.us-east-1.amazonaws.com/iceberg',
        'iceberg.rest.sigv4-enabled' = 'true',
        'iceberg.rest.signing-name' = 's3tables',
        'iceberg.rest.signing-region' = 'us-east-1',
        'iceberg.rest.access-key-id' = '<ak>',
        'iceberg.rest.secret-access-key' = '<sk>'
    );
    ```

- Подключение к `s3 tables` с помощью Glue Rest Catalog 

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

### 03 Доступ к S3Tables {#03-access-s3tables}

```sql
Doris > SWITCH aws_s3_tables;

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

### 04 Создание таблицы S3Tables и запись данных {#04-create-s3tables-table-and-write-data}

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

### 05 Путешествие во времени (Time Travel) {#05-time-travel}

Можно вставить ещё одну порцию данных, а затем использовать системную таблицу `$snapshots` для просмотра снимков Iceberg:

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

Используйте синтаксис `VERSION AS OF` для запросов к разным снимкам:

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

### 06 Доступ к S3 Tables с помощью EMR Spark {#06-access-s3-tables-using-emr-spark}

К данным, записанным с помощью Doris, также можно обращаться через Spark:

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
