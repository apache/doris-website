---
{
    "title": "Insert Into Select",
    "language": "en",
    "description": "INSERT INTO SELECT is a synchronous import method in Doris. It supports inter-table ETL, importing from external tables via Multi-Catalog, and importing files via TVF, while guaranteeing the atomicity of the import.",
    "keywords": [
        "INSERT INTO SELECT",
        "Doris data import",
        "synchronous import",
        "Multi-Catalog import",
        "TVF import",
        "ETL transformation",
        "transaction atomicity",
        "insert_timeout",
        "enable_insert_strict"
    ]
}
---

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Data import / ETL transformation / External data source integration -->

INSERT INTO supports importing the result of a Doris query into another table. It is a **synchronous import** method: it returns the result immediately after execution, and you can determine whether it succeeded from the return value. INSERT INTO guarantees the **atomicity** of the import task: either everything succeeds, or everything fails.

## Use Cases

INSERT INTO SELECT is mainly used in the following three scenarios:

| Scenario | Description |
| --- | --- |
| Inter-table ETL transformation | Apply ETL transformation to data in a Doris table and write it into another Doris table. |
| Importing data from external tables | Map tables from external systems such as MySQL or Hive through Multi-Catalog, and then use INSERT INTO SELECT to import the external data into a Doris table. |
| Direct file import | Use a Table Value Function (TVF) to query files on object storage or HDFS as a table, with automatic column type inference, and then write the result into a Doris table. |

## Basic Principles

INSERT INTO submits an import job to the FE node through the MySQL protocol. The execution flow is as follows:

1. The FE receives the SQL and generates an execution plan. The front part consists of query-related operators, and the last operator is `OlapTableSink`, which writes the query result into the target table.
2. The execution plan is dispatched to BE nodes for execution.
3. Doris selects one BE as the Coordinator node, which is responsible for receiving data and distributing it to other BE nodes.

## Quick Start

INSERT INTO is submitted and transmitted through the MySQL protocol. The following examples use the MySQL command line to demonstrate the complete flow.

For detailed syntax, see [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT).

### Prerequisites

Before execution, you must have the `INSERT` privilege on the target table. If you do not have it, you can grant it with the [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO) command.

### Create an Import Job

**Step 1: Create the source table**

```sql
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**Step 2: Import data into the source table (using INSERT INTO VALUES as an example)**

```sql
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```

**Step 3: Create the target table (with the same schema as the source table)**

```sql
CREATE TABLE testdb.test_table2 LIKE testdb.test_table;
```

**Step 4: Use INSERT INTO SELECT to import into the target table**

```sql
INSERT INTO testdb.test_table2
SELECT * FROM testdb.test_table WHERE age < 30;
Query OK, 3 rows affected (0.544 sec)
{'label':'label_9c2bae970023407d_b2c5b78b368e78a7', 'status':'VISIBLE', 'txnId':'9084'}
```

**Step 5: View the import result**

```sql
MySQL> SELECT * FROM testdb.test_table2 ORDER BY age;
+---------+--------+------+
| user_id | name   | age  |
+---------+--------+------+
|       5 | Ava    |   17 |
|       1 | Emily  |   25 |
|       3 | Olivia |   28 |
+---------+--------+------+
3 rows in set (0.02 sec)
```

**Advanced usage:**

- You can use [JOB](../../../admin-manual/workload-management/job-scheduler) to execute INSERT asynchronously.
- The data source can be a [TVF](../../../lakehouse/file-analysis.md) or a table in a [Catalog](../../../lakehouse/catalog-overview).

### View Import Jobs

Use the `SHOW LOAD` command to view completed INSERT INTO tasks:

```sql
MySQL> SHOW LOAD FROM testdb;
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| JobId  | Label                                   | State    | Progress           | Type   | EtlInfo | TaskInfo                                                             | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL  | JobDetails                                                                                                            | TransactionId | ErrorTablets | User | Comment |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| 376416 | label_3e52da787aab4222_9126d2fce8f6d1e5 | FINISHED | Unknown id: 376416 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:18 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9081          | {}           | root |         |
| 376664 | label_9c2bae970023407d_b2c5b78b368e78a7 | FINISHED | Unknown id: 376664 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:38 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9084          | {}           | root |         |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
```

### Cancel an Import Job

You can cancel a running INSERT INTO job with `Ctrl-C`.

## Reference

### Import Command

INSERT INTO SELECT saves the query result into the target table. The basic syntax is:

```sql
INSERT INTO target_table SELECT ... FROM source_table;
```

The SELECT statement is the same as a regular query and can include `WHERE`, `JOIN`, and other operations.

### Import Configuration Parameters

<!-- Knowledge type: Configuration parameters -->

**FE configuration parameters**

| Parameter | Default | Description |
| --- | --- | --- |
| insert_load_default_timeout_second | 14400 (4 hours) | Timeout of an import task, in seconds. If the task does not complete within this timeout, the system cancels it and the status changes to `CANCELLED`. |

**Session variables**

| Parameter | Default | Description |
| --- | --- | --- |
| insert_timeout | 14400 (4 hours) | Timeout for INSERT INTO as a SQL statement, in seconds. |
| enable_insert_strict | true | When set to true, the import fails if it encounters any non-conforming data. When set to false, non-conforming rows are ignored, and the import is considered successful as long as at least one row is imported correctly. In version 2.1.4 and earlier, INSERT INTO cannot control the error rate; you can only use this parameter to set strict checking or to ignore error data entirely. Common reasons for non-conforming data include: source column length exceeds target column length, column type mismatch, partition mismatch, and column order mismatch. |
| insert_max_filter_ratio | 1.0 | Supported since version 2.1.5. Takes effect only when `enable_insert_strict` is false. It controls the error tolerance ratio of `INSERT INTO FROM S3/HDFS/LOCAL()`. The default value 1.0 means tolerating all errors. The value range is 0 to 1, meaning that the INSERT task fails when the ratio of error rows exceeds this value. |

### Import Return Values

INSERT INTO is a SQL statement, and its return value falls into one of the following three cases depending on the query result:

#### Empty Result Set

If the result set of the SELECT clause is empty, the return is as follows:

```sql
mysql> INSERT INTO tbl1 SELECT * FROM empty_tbl;
Query OK, 0 rows affected (0.02 sec)
```

- `Query OK` indicates that the execution succeeded.
- `0 rows affected` indicates that no data was imported.

#### Non-Empty Result Set with Successful INSERT

```sql
mysql> INSERT INTO tbl1 SELECT * FROM tbl2;
Query OK, 4 rows affected (0.38 sec)
{'label':'INSERT_8510c568-9eda-4173-9e36-6adc7d35291c', 'status':'visible', 'txnId':'4005'}

mysql> INSERT INTO tbl1 WITH LABEL my_label1 SELECT * FROM tbl2;
Query OK, 4 rows affected (0.38 sec)
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}

mysql> INSERT INTO tbl1 SELECT * FROM tbl2;
Query OK, 2 rows affected, 2 warnings (0.31 sec)
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'visible', 'txnId':'4005'}

mysql> INSERT INTO tbl1 SELECT * FROM tbl2;
Query OK, 2 rows affected, 2 warnings (0.31 sec)
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
```

Field descriptions:

- `Query OK`: execution succeeded.
- `4 rows affected`: 4 rows were imported in total.
- `2 warnings`: number of rows that were filtered out.

A JSON string is also returned:

```Plain
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

The fields in the return value are described below:

| Parameter | Description |
| -------- | ---- |
| TxnId    | ID of the import transaction. |
| Label    | Label of the import job. You can specify it with `INSERT INTO tbl WITH LABEL label ...`. |
| Status   | Indicates whether the imported data is visible:<p>- `visible`: the import succeeded and the data is visible.</p><p>- `committed`: the import has completed; the data may become visible with some delay, and no retry is needed.</p><p>- `Label Already Exists`: the label is duplicated and you need to use a different label.</p><p>- `Fail`: the import failed.</p> |
| Err      | Error message of the import. |

To view the rows that were filtered out, use the [SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD) statement:

```sql
SHOW LOAD WHERE label="xxx";
```

The `URL` field in the return value can be used to query the error data. See [View Error Rows](#view-error-rows) below.

The `committed` state is temporary, and the data is guaranteed to become visible eventually. You can query the visibility state with the [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION) statement:

```sql
SHOW TRANSACTION WHERE id=4005;
```

When the `TransactionStatus` column in the return value is `visible`, the data is visible.

```sql
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

#### Non-Empty Result Set with Failed INSERT

A failure means that no data was imported successfully. The return is as follows:

```sql
mysql> INSERT INTO tbl1 SELECT * FROM tbl2 WHERE k1 = "a";
ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=_shard_2/error_loginsert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0bf8a2
```

- `ERROR 1064 (HY000): all partitions have no load data`: the reason for the failure.
- The returned URL can be used to query the error data. See [View Error Rows](#view-error-rows) below.

## Best Practices

### Importing Large Volumes of Data

INSERT INTO has no limit on data volume and supports importing large volumes of data. However, when the data volume is large, you need to adjust the timeout to ensure:

> Import timeout >= Data volume / Estimated import speed

You can adjust the following two parameters:

1. The FE configuration parameter `insert_load_default_timeout_second`.
2. The session variable `insert_timeout`.

### View Error Rows

<!-- Knowledge type: Troubleshooting -->

When the INSERT INTO return value provides a `url` field, you can view the error rows with the following command:

```sql
SHOW LOAD WARNINGS ON "url";
```

Example:

```sql
SHOW LOAD WARNINGS ON "http://ip:port/api/_load_error_log?file=_shard_13/error_loginsert_stmt_d2cac0a0a16d482d-9041c949a4b71605_d2cac0a0a16d482d_9041c949a4b71605";
```

**Common error causes:**

- Source column length exceeds target column length.
- Column type mismatch.
- Partition mismatch.
- Column order mismatch.

You can control whether INSERT INTO ignores error rows with the session variable `enable_insert_strict`.

## Importing External Table Data via Multi-Catalog

<!-- Applicable scenarios: External data source integration -->

Through the Multi-Catalog feature, Doris supports connecting to mainstream data lakes and databases such as Apache Hive, Apache Iceberg, Apache Hudi, Apache Paimon (Incubating), Elasticsearch, MySQL, Oracle, and SQL Server. After creating an external table, you can import the external table data with `INSERT INTO SELECT`, or query it directly with `SELECT`.

For details on Multi-Catalog, see the lakehouse documentation. The following example uses a Hive external table to illustrate the import flow.

### Step 1: Create a Hive Catalog

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hadoop.username' = 'hive',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:8088',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:8088',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

### Step 2: Create the Doris Target Table

```sql
CREATE TABLE `target_tbl` (
  `k1` decimal(9, 3) NOT NULL COMMENT "",
  `k2` char(10) NOT NULL COMMENT "",
  `k3` datetime NOT NULL COMMENT "",
  `k5` varchar(20) NOT NULL COMMENT "",
  `k6` double NOT NULL COMMENT ""
)
COMMENT "Doris Table"
DISTRIBUTED BY HASH(k1) BUCKETS 2
PROPERTIES (
    "replication_num" = "1"
);
```

For detailed instructions on creating tables, see the [CREATE-TABLE](../../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE) syntax reference.

### Step 3: Execute the Import

Import from the `hive.db1.source_tbl` table into the `target_tbl` table:

```sql
INSERT INTO target_tbl SELECT k1,k2,k3 FROM  hive.db1.source_tbl limit 100;
```

INSERT is a synchronous command. A successful return means the import succeeded.

### Notes

- You must ensure that the external data source and the Doris cluster have network connectivity, especially between the BE nodes and the external data source.

## Importing File Data via TVF

<!-- Applicable scenarios: Direct import of files from object storage / HDFS -->

Through Table Value Function (TVF), Doris can directly query and analyze files on object storage or HDFS as a table, with automatic column type inference and multi-file import. For details, see the [Lakehouse / TVF documentation](../../../lakehouse/file-analysis).

TVF supports wildcards (`*`, `?`, `[...]`) and range patterns (`{1..10}`) in file paths. For the full syntax, see [File path pattern](../../../sql-manual/basic-element/file-path-pattern).

### Automatic File Column Type Inference

Using S3 TVF as an example, first inspect the file schema with `DESC FUNCTION`:

```Plain
DESC FUNCTION s3 (
    "URI" = "http://127.0.0.1:9312/test2/test.snappy.parquet",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style"="true"
);
+---------------+--------------+------+-------+---------+-------+
| Field         | Type         | Null | Key   | Default | Extra |
+---------------+--------------+------+-------+---------+-------+
| p_partkey     | INT          | Yes  | false | NULL    | NONE  |
| p_name        | TEXT         | Yes  | false | NULL    | NONE  |
| p_mfgr        | TEXT         | Yes  | false | NULL    | NONE  |
| p_brand       | TEXT         | Yes  | false | NULL    | NONE  |
| p_type        | TEXT         | Yes  | false | NULL    | NONE  |
| p_size        | INT          | Yes  | false | NULL    | NONE  |
| p_container   | TEXT         | Yes  | false | NULL    | NONE  |
| p_retailprice | DECIMAL(9,0) | Yes  | false | NULL    | NONE  |
| p_comment     | TEXT         | Yes  | false | NULL    | NONE  |
+---------------+--------------+------+-------+---------+-------+
```

Notes:

- The example specifies the file path, connection information, and authentication information.
- You can view the file schema with `DESC FUNCTION`.
- For Parquet files, Doris automatically infers column types from file metadata.
- Doris currently supports analysis and column type inference for Parquet, ORC, CSV, and JSON formats.

### Importing with INSERT INTO SELECT

```Plain
// 1. Create a Doris internal table
CREATE TABLE IF NOT EXISTS test_table
(
    id int,
    name varchar(50),
    age int
)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES("replication_num" = "1");

// 2. Insert data using the S3 Table Value Function
INSERT INTO test_table (id,name,age)
SELECT cast(id as INT) as id, name, cast (age as INT) as age
FROM s3(
    "uri" = "http://127.0.0.1:9312/test2/test.snappy.parquet",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style" = "true");
```

### Notes

- If the URI specified for the `S3 / hdfs` TVF does not match any file, or all matched files are empty, the TVF returns an empty result set. In this case, using `DESC FUNCTION` to view the schema returns a single fake column named `__dummy_col`, which can be ignored.
- If the TVF format is specified as CSV and the error `The first line is empty, can not parse column numbers` is reported, the cause is that the schema cannot be parsed from the first line of the file.

## FAQ

<!-- Knowledge type: FAQ -->

**Q1: Is INSERT INTO synchronous or asynchronous?**

INSERT INTO is **synchronous** by default and returns the result immediately after execution. To execute it asynchronously, you can combine it with [JOB](../../../admin-manual/workload-management/job-scheduler).

**Q2: Will partial data be written when INSERT INTO fails?**

No. INSERT INTO guarantees **atomicity**: either everything succeeds, or everything fails.

**Q3: How do I handle import timeouts?**

Adjust the following two parameters to ensure that `Import timeout >= Data volume / Estimated import speed`:

- FE configuration: `insert_load_default_timeout_second`
- Session variable: `insert_timeout`

**Q4: How do I control tolerance for error data?**

- `enable_insert_strict = true`: fail immediately when any non-conforming data is encountered.
- `enable_insert_strict = false`: ignore non-conforming rows (version 2.1.4 and earlier).
- Since version 2.1.5, you can use `insert_max_filter_ratio` (which only takes effect when `enable_insert_strict = false`) to control the error tolerance by ratio. It applies only to `INSERT INTO FROM S3/HDFS/LOCAL()`.

**Q5: What should I do when the status returns `committed` but not `visible`?**

`committed` means that the import has completed, and the data is guaranteed to become visible eventually, so no retry is needed. You can use [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION) to check whether `TransactionStatus` has changed to `visible`.

## More Help

For more detailed syntax of INSERT INTO, see the [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT) command reference. You can also enter `HELP INSERT` in the MySQL client command line for more help.
