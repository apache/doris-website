---
{
    "title": "Insert Into",
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

The INSERT INTO statement supports importing the results of a Doris query into another table. INSERT INTO is a synchronous import method, where the import result is returned after the import is executed. Whether the import is successful can be determined based on the returned result. INSERT INTO ensures the atomicity of the import task, meaning that either all the data is imported successfully or none of it is imported.

- INSERT INTO tbl SELECT...

## Applicable scenarios

2. If a user wants to perform ETL on existing data in a Doris table and then import it into a new Doris table, the INSERT INTO SELECT syntax is applicable.
3. In conjunction with the Multi-Catalog external table mechanism, tables from MySQL or Hive systems can be mapped via Multi-Catalog. Then, data from external tables can be imported into Doris tables using the INSERT INTO SELECT syntax.
4. Utilizing the Table Value Functions (TVFs), users can directly query data stored in object storage or files on HDFS as tables, with automatic column type inference. Then, data from external tables can be imported into Doris tables using the INSERT INTO SELECT syntax.

## Implementation

When using INSERT INTO, the import job needs to be initiated and submitted to the FE node using the MySQL protocol. The FE generates an execution plan, which includes query-related operators, with the last operator being the OlapTableSink. The OlapTableSink operator is responsible for writing the query result to the target table. The execution plan is then sent to the BE nodes for execution. Doris designates one BE node as the Coordinator, which receives and distributes the data to other BE nodes.

## Get started

An INSERT INTO job is submitted and transmitted using the MySQL protocol. The following example demonstrates submitting an import job using INSERT INTO through the MySQL command-line interface.

Detailed syntax can be found in the INSERT INTO documentation.

### Preparation

INSERT INTO requires INSERT permissions on the target table. You can grant permissions to user accounts using the GRANT command.

### Create an INSERT INTO job

1. Create a source table

```SQL
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User name",
    age                INT                   COMMENT "User age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

2. Import data into the source table using any load method. (Here we use `INSERT INTO VALUES` for example).

```SQL
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```

3. Building upon the above operations, create a new table as the target table (with the same schema as the source table).

```SQL
CREATE TABLE testdb.test_table2 LIKE testdb.test_table;
```

4. Ingest data into the new table using `INSERT INTO SELECT`.

```SQL
INSERT INTO testdb.test_table2
SELECT * FROM testdb.test_table WHERE age < 30;
Query OK, 3 rows affected (0.544 sec)
{'label':'label_9c2bae970023407d_b2c5b78b368e78a7', 'status':'VISIBLE', 'txnId':'9084'}
```

5. View imported data.

```SQL
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

6. You can use [JOB](../../scheduler/job-scheduler.md) make the INSERT operation execute asynchronously.

7. Sources can be [tvf](../../../lakehouse/file.md) or tables in a [catalog](../../../lakehouse/database).

### View INSERT INTO jobs

You can use the `SHOW LOAD` command to view the completed INSERT INTO tasks.

```SQL
MySQL> SHOW LOAD FROM testdb;
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| JobId  | Label                                   | State    | Progress           | Type   | EtlInfo | TaskInfo                                                             | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL  | JobDetails                                                                                                            | TransactionId | ErrorTablets | User | Comment |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| 376416 | label_3e52da787aab4222_9126d2fce8f6d1e5 | FINISHED | Unknown id: 376416 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:18 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9081          | {}           | root |         |
| 376664 | label_9c2bae970023407d_b2c5b78b368e78a7 | FINISHED | Unknown id: 376664 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:38 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9084          | {}           | root |         |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
```

### Cancel INSERT INTO jobs

You can cancel the currently executing INSERT INTO job via Ctrl-C.

## Manual

### Syntax

The syntax of INSERT INTO is as follows:

1. INSERT INTO SELECT

INSERT INTO SELECT is used to write the query results to the target table.

```SQL
INSERT INTO target_table SELECT ... FROM source_table;
```

The SELECT statement above is similar to a regular SELECT query, allowing operations such as WHERE and JOIN.

### Parameter configuration

**FE** **configuration**

insert_load_default_timeout_second

- Default value: 14400s (4 hours)
- Description: Timeout for import tasks, measured in seconds. If the import task does not complete within this timeout period, it will be canceled by the system and marked as CANCELLED.

**Environment parameters**

insert_timeout

- Default value: 14400s (4 hours)
- Description: Timeout for INSERT INTO as an SQL statement, measured in seconds. 

enable_insert_strict

- Default value: true
- Description: If this is set to true, INSERT INTO will fail when the task involves invalid data. If set to false, INSERT INTO will ignore invalid rows, and the import will be considered successful as long as at least one row is imported successfully.
- Explanation: Until version 2.1.4. INSERT INTO cannot control the error rate, so this parameter is used to either strictly check data quality or completely ignore invalid data. Common reasons for data invalidity include: source data column length exceeding destination column length, column type mismatch, partition mismatch, and column order mismatch.

insert_max_filter_ratio

- Default value: 1.0

- Description: Since version 2.1.5. Only effective when `enable_insert_strict` is false. Used to control the error tolerance when using `INSERT INTO FROM S3/HDFS/LOCAL()`. The default value is 1.0, which means all errors are tolerated. It can be a decimal between 0 and 1. It means that when the number of error rows exceeds this ratio, the INSERT task will fail.

### Return values

INSERT INTO an SQL statement, and it returns different results based on different query outcomes:

**Empty result set**

If the query result set of the SELECT statement in INSERT INTO is empty, the returned value will be as follows:

```SQL
mysql> INSERT INTO tbl1 SELECT * FROM empty_tbl;
Query OK, 0 rows affected (0.02 sec)
```

`Query OK` indicates successful execution. `0 rows affected` means no data was imported.

**Non-empty result set and successful INSERT**

```SQL
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

`Query OK` indicates successful execution. `4 rows affected` indicates that a total of 4 rows of data have been imported. `2 warnings` indicates the number of rows that were filtered out. 

Additionally, a JSON string is returned:

```Plain
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

Parameter description:

| Parameter | Description                                                  |
| --------- | ------------------------------------------------------------ |
| TxnId     | ID of the import transaction                                 |
| Label     | Label of the import job: can be specified using "INSERT INTO tbl WITH LABEL label..." |
| Status    | Visibility of the imported data: If it is visible, it will be displayed as "visible." If not, it will be displayed as "committed." In the "committed" state, the import is completed, but the data may be delayed in becoming visible. There is no need to retry in this case.`visible`: The import is successful and the data is visible.`committed`: The import is completed, but the data may be delayed in becoming visible. There is no need to retry in this case.Label Already Exists: The specified label already exists and needs to be changed to a different one.Fail: The import fails. |
| Err       | Error message                                                |

You can use the [SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD/) statement to view the filtered rows.

```SQL
SHOW LOAD WHERE label="xxx";
```

The result of this statement will include a URL that can be used to query the error data. For more details, refer to the "View error rows" section below.

The invisible state of data is temporary, and the data will eventually become visible. 

You can check the visibility status of a batch of data using the [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION/) statement.

```SQL
SHOW TRANSACTION WHERE id=4005;
```

If the `TransactionStatus` column in the result is `visible`, it indicates that the data is visible.

```SQL
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

**Non-empty result set but failed INSERT**

Failed execution means that no data was successfully imported. An error message will be returned:

```SQL
mysql> INSERT INTO tbl1 SELECT * FROM tbl2 WHERE k1 = "a";
ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=_shard_2/error_loginsert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0bf8a2
```

`ERROR 1064 (HY000): all partitions have no load data` indicates the root cause for the failure. The URL provided in the error message can be used to locate the error data. For more details, refer to the "View error rows" section below.

## Best practice

### Data size

INSERT INTO imposes no limitations on data volume and can support large-scale data imports. However, if you are importing a large amount of data, it is recommended to adjust the system's INSERT INTO timeout settings to ensure that `import timeout >= data volume ``/`` estimated import speed`.

1. FE configuration parameter `insert_load_default_timeout_second`
2. Environment parameter `insert_timeout`

### View error rows

When the INSERT INTO result includes a URL field, you can use the following command to view the error rows:

```SQL
SHOW LOAD WARNINGS ON "url";
```

Example:

```SQL
SHOW LOAD WARNINGS ON "http://ip:port/api/_load_error_log?file=_shard_13/error_loginsert_stmt_d2cac0a0a16d482d-9041c949a4b71605_d2cac0a0a16d482d_9041c949a4b71605";
```

Common reasons for errors include: source data column length exceeding destination column length, column type mismatch, partition mismatch, and column order mismatch.

You can control whether INSERT INTO ignores error rows by configuring the environment variable `enable_insert_strict`.

## Ingest external data via Multi-Catalog

Doris supports the creation of external tables. Once created, data from external tables can be imported into Doris internal tables using `INSERT INTO SELECT`, or queried directly using SELECT statements.

With its Multi-Catalog feature, Doris supports connections to various mainstream data lakes and databases including Apache Hive, Apache Iceberg, Apache Hudi, Apache Paimon (Incubating), Elasticsearch, MySQL, Oracle, and SQL Server.

For more information on Multi-Catalog, please refer to [Lakehouse overview](../../../lakehouse/lakehouse-overview/#multi-catalog).

The followings illustrate importing data from a Hive external table into a Doris internal table.

### Create Hive Catalog

```SQL
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

### Ingest data

1. Create a target table for the data import in Doris.

```SQL
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

2. For detailed instructions on creating Doris tables, please refer to [CREATE TABLE](../../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE/).

3. Importing data (from the `hive.db1.source_tbl` table into the `target_tbl` table).

```SQL
INSERT INTO target_tbl SELECT k1,k2,k3 FROM  hive.db1.source_tbl limit 100;
```

The INSERT command is a synchronous command. If it returns a result, that indicates successful import.

### Notes

- Ensure that the external data source and the Doris cluster can communicate, including mutual network accessibility between BE nodes and external data sources.

## Ingest data by TVF

Doris can directly query and analyze files stored in object storage or HDFS as tables through the Table Value Functions (TVFs), which supports automatic column type inference. For detailed information, please refer to the Lakehouse/TVF documentation.

### Automatic column type inference

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

In this example of an S3 TVF, the file path, connection information, and authentication information are specified.

You can use the `DESC FUNCTION` syntax to view the schema of this file.

It can be seen that for Parquet files, Doris automatically infers column types based on the metadata within the file.

Currently, Doris supports analysis and column type inference for Parquet, ORC, CSV, and JSON formats.

It can be used in combination with the `INSERT INTO SELECT` syntax to quickly import files into Doris tables for faster analysis.

```Plain
// 1. Create Doris internal table
CREATE TABLE IF NOT EXISTS test_table
(
    id int,
    name varchar(50),
    age int
)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES("replication_num" = "1");

// 2. Insert data by S3 Table Value Function
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

- If the URI specified in the `S3 / hdfs` TVF does not match any files, or if all matched files are empty, the `S3 / hdfs` TVF will return an empty result set. In such cases, if you use `DESC FUNCTION` to view the schema of the file, you will see a dummy column `__dummy_col`, which can be ignored.
- If the format specified for the TVF is CSV and the file being read is not empty but the first line of the file is empty, an error will be prompted: `The first line is empty, can not parse column numbers`. This is because the schema cannot be parsed from the first line of the file.

## More help

For more detailed syntax on INSERT INTO, refer to the [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT/) command manual. You can also type `HELP INSERT` at the MySQL client command line for further information.
