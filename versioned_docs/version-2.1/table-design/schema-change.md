---
{
    "title": "Schema Evolution",
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

Users can modify the schema of an existing table through the Schema Change operation. The  schema of a table mainly includes the modification of columns and the modification of indexes. Here we mainly introduce the column-related  Scheme  changes. For index-related changes, you can check the data table design/table index to see the change method of each index.

## Glossary

- Base Table: When each table is created, it corresponds to a base table.

- Rollup: A roll-up table created based on a base table or other rollup.

- Index: materialized index. Rollup or base table are both called materialized indexes.

- Transaction: Each import task is a transaction, and each transaction has a unique increasing transaction ID.

## Introduction

**Overview**

The implementation of Schema Change is divided into two major categories: Light Weight Schema Change and Heavy Weight Schema Change.

- Light Weight Schema Change is completed quickly by synchronously modifying only the FE's metadata, typically within seconds. Adding or dropping value columns, changing column names, and increasing the length of VARCHAR columns (except for DUP KEY columns and UNIQUE KEY columns) all use the logic of Light Weight Schema Change.

- Heavy Weight Schema Change relies on the BE for data file transformation. The specific implementation methods are as follows:

    |Schema change Implementation | Main Logic | Typical Scenario |
    |-----------------|------|---------|----------|
    | Direct Schema Change | Rewrites the data files holistically without involving reordering | Changing the data type of value columns |
    | Sort Schema Change | Rewrites the data files holistically and reorders them | Changing the data type of key columns |
    | Hard Linked Schema Change | Relinks the data files without directly modifying the data files | Replaced by Light Weight Schema Change for column changes |

**Main Process**

For Light Weight Schema Change, only the corresponding metadata in FE is modified after the Alter command is issued, and the return of the Alter command signifies the end of the schema change.

For Heavy Weight Schema Change, after the user issues the Alter command, a task for schema change is started in the background, and the return of the command signifies the successful submission of the schema change task. The execution of the background task goes through the following process:

1. For each tablet of the target table, a corresponding new tablet is created according to the schema after the change, used for storing the transformed data.
2. Wait for all previous import transactions to end before starting data transformation.
3. Start data transformation, task by task for each tablet, writing the data from the old tablet after the change to the newly created tablet. The differences among the three heavy weight Schema Changes are in this step, where data transformation is carried out according to their respective implementation logics mentioned above.
4. After the data transformation starts, if a new import transaction is created, to ensure data integrity, the new import transaction will simultaneously generate data for both the old tablet and the new tablet, known as dual writing. Data written during the dual write period must be compatible with both the new and old schemas, otherwise, the import will fail.
    ```Plain
    +----------+
    | Load Job |
    +----+-----+
        |
        | Load job generates both origin and new Index data
        |
        |      +------------------+ +---------------+
        |      | Origin Index     | | Origin Index  |
        +------> New Incoming Data| | History Data  |
        |      +------------------+ +------+--------+
        |                                  |
        |                                  | Convert history data
        |                                  |
        |      +------------------+ +------v--------+
        |      | New Index        | | New Index     |
        +------> New Incoming Data| | History Data  |
                +------------------+ +---------------+
    ```
5. After the data transformation is completed, all tablets storing old data will be deleted, and all new tablets that have completed the data change will replace the old tablets for service.

The specific syntax for creating schema changes can be found in the schema change section of the help [ALTER TABLE COLUMN](../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-TABLE-COLUMN)

## Adding a column at a specified position to a specified index

### Syntax

```sql
ALTER TABLE table_name ADD COLUMN column_name column_type [KEY | agg_type] [DEFAULT "default_value"]
[AFTER column_name|FIRST]
[TO rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```

- For aggregate models, if adding a value column, specify `agg_type`.

- For non-aggregate models (e.g., DUPLICATE KEY), if adding a key column, specify the `KEY` keyword.

- You cannot add a column to a rollup index that already exists in the base index (if needed, you can create a new rollup index).

### Examples

#### non-aggregate model

table's DDL:

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col1 int,
    col2 int,
    col3 int,
    col4 int,
    col5 int
) DUPLICATE KEY(col1, col2, col3)
DISTRIBUTED BY RANDOM BUCKETS 1
ROLLUP (
    example_rollup_index (col1, col3, col4, col5)
)
PROPERTIES (
    "replication_num" = "1"
)
```

**1. Adding a key column `new_col` after col1 to `example_rollup_index`**

```sql
ALTER TABLE example_db.my_table
ADD COLUMN new_col INT KEY DEFAULT "0" AFTER col1
TO example_rollup_index;
```

**2. Adding a value column `new_col` with a default value of 0 after col1 to `example_rollup_index`**

```sql
ALTER TABLE example_db.my_table   
ADD COLUMN new_col INT DEFAULT "0" AFTER col1    
TO example_rollup_index;
```

#### aggregate model

table's DDL:

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col1 int,
    col2 int,
    col3 int,
    col4 int SUM,
    col5 varchar(32) REPLACE DEFAULT "abc"
) AGGREGATE KEY(col1, col2, col3)
DISTRIBUTED BY HASH(col1) BUCKETS 1
ROLLUP (
    example_rollup_index (col1, col3, col4, col5)
)
PROPERTIES (
    "replication_num" = "1"
)
```

**3. Adding a Key column `new_col` after col1 to `example_rollup_index`**

```sql
ALTER TABLE example_db.my_table   
ADD COLUMN new_col INT DEFAULT "0" AFTER col1    
TO example_rollup_index;
```

**4. Adding a value column `new_col` with SUM aggregation type after col1 to `example_rollup_index`**

```sql
ALTER TABLE example_db.my_table   
ADD COLUMN new_col INT SUM DEFAULT "0" AFTER col1    
TO example_rollup_index;
```

## Adding multiple columns to a specified index

### Syntax

```sql
ALTER TABLE table_name ADD COLUMN (column_name1 column_type [KEY | agg_type] DEFAULT "default_value", ...)
[TO rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```

- For aggregate models, if adding a value column, specify `agg_type`.

- For aggregate models, if adding a key column, specify the KEY keyword.

- You cannot add a column to a rollup index that already exists in the base index (if needed, you can create a new rollup index).

### Example

Adding multiple columns (aggregate model) to `example_rollup_index`:

```sql
ALTER TABLE example_db.my_table
ADD COLUMN (c1 INT DEFAULT "1", c2 FLOAT SUM DEFAULT "0")
TO example_rollup_index;
```

## Removing a column from a specified index

### Syntax

```sql
ALTER TABLE table_name DROP COLUMN column_name
[FROM rollup_index_name]
```

- You cannot delete a partition column.

- If you delete a column from the base index, it will also be removed from the rollup index if it contains the column.

### Example

Removing column col2 from `example_rollup_index`:

```sql
ALTER TABLE example_db.my_table
DROP COLUMN col3
FROM example_rollup_index;
```

## Modifying the column type and position of a specified index

### Syntax

```sql
ALTER TABLE table_name MODIFY COLUMN column_name column_type [KEY | agg_type] [NULL | NOT NULL] [DEFAULT "default_value"]
[AFTER column_name|FIRST]
[FROM rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```

- For aggregate models, if modifying a value column, specify `agg_type`.

- For non-aggregate models, if modifying a key column, specify the **KEY** keyword.

- Only the column type can be modified, other column properties remain the same (i.e., other properties need to be explicitly written in the statement, see Example 8).

- Partition and bucket columns cannot be modified.

- Currently, the following type conversions are supported (users need to ensure precision loss):

  - Conversion from TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE to a larger numeric type.

  - Conversion from TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE/DECIMAL to VARCHAR.

  - Modification of maximum length for VARCHAR.

  - Conversion from VARCHAR/CHAR to TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE.

  - Conversion from VARCHAR/CHAR to DATE (supports six formatting formats: "%Y-%m-%d", "%y-%m-%d", "%Y%m%d", "%y%m%d", "%Y/%m/%d", "%y/%m/%d").

  - Conversion from DATETIME to DATE (only retains year-month-day information, e.g., `2019-12-09 21:47:05` <--> `2019-12-09`).

  - Conversion from DATE to DATETIME (automatically adds zeros for hours, minutes, and seconds, e.g., `2019-12-09` <--> `2019-12-09 00:00:00`).

  - Conversion from FLOAT to DOUBLE.

  - Conversion from INT to DATE (if the INT type data is invalid, the conversion fails, and the original data remains unchanged).

  - All types except DATE and DATETIME can be converted to STRING, but STRING cannot be converted to any other type.

### Examples

table's DDL:

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col0 int,
    col1 int DEFAULT "1",
    col2 int,
    col3 varchar(32),
    col4 int SUM,
    col5 varchar(32) REPLACE DEFAULT "abc"
) AGGREGATE KEY(col0, col1, col2, col3)
DISTRIBUTED BY HASH(col0) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
)
```

**1. Modifying the column type of Key column col1 to BIGINT in the base index and moving it after column col2**

```sql
ALTER TABLE example_db.my_table 
MODIFY COLUMN col1 BIGINT KEY DEFAULT "1" AFTER col2;
```

Note: whether modifying a key column or a value column, the complete column information needs to be declared.

**2. Modifying the maximum length of column val1 in the Base Index. The original val1 is (val1 VARCHAR(32) REPLACE DEFAULT "abc")**

```sql
ALTER TABLE example_db.my_table
MODIFY COLUMN col5 VARCHAR(64) REPLACE DEFAULT "abc";
```

Note: only the column type can be modified while keeping the other properties of the column unchanged.

**3. Modifying the length of a field in the key column of a duplicate key table**

```sql
ALTER TABLE example_db.my_table
MODIFY COLUMN col3 varchar(50) KEY NULL comment 'to 50'
```

## Reorder columns for a specified index

### Syntax

```sql
ALTER TABLE table_name ORDER BY (column_name1, column_name2, ...)
[FROM rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```

- All columns in the index should be listed.

- Value columns come after key columns.

### Example

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    k1 int DEFAULT "1",
    k2 int,
    k3 varchar(32),
    k4 date,
    v1 int SUM,
    v2 int MAX,
) AGGREGATE KEY(k1, k2, k3, k4)
DISTRIBUTED BY HASH(k1) BUCKETS 1
ROLLUP (
    example_rollup_index(k1, k2, k3, v1, v2)
)
PROPERTIES (
    "replication_num" = "1"
)
```

Reorder columns in the index `example_rollup_index` (assuming the original column order is: k1, k2, k3, v1, v2).

```sql
ALTER TABLE example_db.my_table
ORDER BY (k3,k1,k2,v2,v1)
FROM example_rollup_index;
```

## Perform multiple changes in one submission

Schema change can modify multiple indexes in a single job.

### Example 1

Source Schema:

```sql
CREATE TABLE IF NOT EXISTS example_db.tbl1(
    k1 int,
    k2 int,
    k3 int
) AGGREGATE KEY(k1, k2, k3)
DISTRIBUTED BY HASH(k1) BUCKETS 1
ROLLUP (
    rollup1 (k1, k2),
    rollup2 (k2)
)
PROPERTIES (
    "replication_num" = "1"
)
```

You can use the following command to add a column k4 to rollup1 and rollup2, and add an additional column k5 to rollup2:

```sql
ALTER TABLE tbl1
ADD COLUMN k4 INT default "1" to rollup1,
ADD COLUMN k4 INT default "1" to rollup2,
ADD COLUMN k5 INT default "1" to rollup2;
```

After completion, the schema becomes:

```Plain
+-----------+-------+------+------+------+---------+-------+
| IndexName | Field | Type | Null | Key  | Default | Extra |
+-----------+-------+------+------+------+---------+-------+
| tbl1      | k1    | INT  | No   | true | N/A     |       |
|           | k2    | INT  | No   | true | N/A     |       |
|           | k3    | INT  | No   | true | N/A     |       |
|           | k4    | INT  | No   | true | 1       |       |
|           | k5    | INT  | No   | true | 1       |       |
|           |       |      |      |      |         |       |
| rollup2   | k2    | INT  | No   | true | N/A     |       |
|           | k4    | INT  | No   | true | 1       |       |
|           | k5    | INT  | No   | true | 1       |       |
|           |       |      |      |      |         |       |
| rollup1   | k1    | INT  | No   | true | N/A     |       |
|           | k2    | INT  | No   | true | N/A     |       |
|           | k4    | INT  | No   | true | 1       |       |
+-----------+-------+------+------+------+---------+-------+
```

As seen, the base table tbl1 automatically includes the columns k4 and k5. Any columns added to a rollup will automatically be added to the base table.

Additionally, it is not allowed to add columns to a rollup that already exist in the base table. If a user needs to do so, they can create a new rollup with the additional columns and then delete the original rollup.

### Example 2

table's DDL

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    k1 int DEFAULT "1",
    k2 int,
    k3 varchar(32),
    k4 date,
    v1 int SUM,
) AGGREGATE KEY(k1, k2, k3, k4)
DISTRIBUTED BY HASH(k1) BUCKETS 1
ROLLUP (
    example_rollup_index(k1, k3, k2, v1)
)
PROPERTIES (
    "replication_num" = "1"
)
```

```sql
ALTER TABLE example_db.my_table
ADD COLUMN v2 INT MAX DEFAULT "0" TO example_rollup_index,
ORDER BY (k3,k1,k2,v2,v1) FROM example_rollup_index;
```

## Rename Column

Syntax

```sql
ALTER TABLE RENAME COLUMN old_column_name new_column_name;    
```

## Check Job Status

Users could use the `SHOW ALTER TABLE COLUMN` command to check the progress of the schema change job.

`SHOW ALTER TABLE COLUMN` allows you to view the currently executing or completed schema Change jobs. When a schema change job involves multiple indexes, the command will display multiple rows, with each row corresponding to an index. For example:

```sql
mysql > SHOW ALTER TABLE COLUMN\G;
*************************** 1. row ***************************
        JobId: 20021
    TableName: tbl1
   CreateTime: 2019-08-05 23:03:13
   FinishTime: 2019-08-05 23:03:42
    IndexName: tbl1
      IndexId: 20022
OriginIndexId: 20017
SchemaVersion: 2:792557838
TransactionId: 10023
        State: FINISHED
          Msg: 
     Progress: NULL
      Timeout: 86400
1 row in set (0.00 sec)
```

- JobId: unique ID for each schema change job.

- TableName: name of the base table associated with schema change.

- CreateTime: time when the job was created.

- FinishTime: time when the job is finished. If not finished, it displays "N/A".

- IndexName: name of one of the indexes involved in the modification.

- IndexId: unique ID of the new index.

- OriginIndexId: unique ID of the old index.

- SchemaVersion: displayed in the format M:N, where M represents the version of the schema change modification, and N represents the corresponding hash value. The version increments with each schema change.

- TransactionId: transaction ID that serves as the boundary for transforming historical data.

- State: current state of the job.

  - PENDING: the job is waiting in the queue to be scheduled.

  - WAITING_TXN: waiting for import tasks before the boundary transaction ID to complete.
  
  - RUNNING: historical data transformation is in progress.
  
  - FINISHED: the job completed successfully.
  
  - CANCELLED: the job was cancelled.

- Msg: if the job fails, this field displays the failure message.

- Progress: job progress. It is only displayed when the state is RUNNING. Progress is shown in the format M/N, where N is the total number of replicas involved in the schema change, and M is the number of replicas that have completed historical data transformation.

- Timeout: job timeout in seconds.

## Cancel Job

In cases where the job state is not FINISHED or CANCELLED, you can cancel the schema change job using the following command:

```sql
CANCEL ALTER TABLE COLUMN FROM tbl_name;
```

## Notes

- Only one schema change job can run on a table at a time.

- Schema change operations do not block import and query operations. Unless the operation affects the table's metadata (e.g., a partition is created during an auto partition table's import)

- Partition and bucket columns cannot be modified.

- If the schema includes value columns aggregated using the REPLACE method, it is not allowed to delete key columns.

- If a key column is deleted, Doris cannot determine the values for the REPLACE columns.

- All non-key columns in a unique data model table are aggregated using the REPLACE method.

- When adding a value column with an aggregation type of SUM or REPLACE, the default value for that column has no meaning for historical data.

- Since the historical data has lost detailed information, the default value does not reflect the actual aggregated value.

- When modifying the column type, all fields except Type need to be completed based on the information from the original column.

- For example, to modify the column `k1 from INT SUM NULL DEFAULT "1"` to BIGINT, the command would be: `ALTER TABLE tbl1 MODIFY COLUMN k1 BIGINT SUM NULL DEFAULT "1"`;

- Note that apart from the new column type, other attributes such as the aggregation method, nullable property, and default value should be completed based on the original information.

- It is not supported to modify aggregation types, nullable properties, or default values.

## FAQs

**Schema change execution speed**

For a Light Schema Change, such as adding or deleting Value columns, the execution speed can be in the millisecond range. For other types of Schema Change, the execution speed is estimated to be around 10MB/s in the worst-case scenario. As a conservative measure, users can set the job timeout based on this speed.

**Error:** **`"Table xxx is not stable"`** **when submitting a job**

Schema Change can only be initiated when the table data is complete and in a balanced state. If some data shard replicas of the table are incomplete or if some replicas are undergoing balancing operations, the submission will be rejected. You can check if the data shard replicas are complete using the following command:

```sql
SHOW REPLICA STATUS FROM tbl WHERE STATUS != "OK";
```

If there are any results returned, it indicates that there are issues with the replicas. Typically, the system will automatically repair these issues, but users can prioritize the repair for a specific table using the following command:

```sql
ADMIN REPAIR TABLE tbl1;
```

You can check if there are any running balancing tasks using the following command:

```sql
SHOW PROC "/cluster_balance/pending_tablets";
```

You can wait for the balancing tasks to complete or temporarily disable balancing operations using the following command:

```sql
ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");
```

## Configurations

### FE Configuration

- `alter_table_timeout_second`: Default timeout for jobs, set to 86400 seconds.

### BE Configuration

- `alter_tablet_worker_count`: Number of threads used on the BE side for executing historical data transformation. The default is 3. If you want to speed up Schema Change jobs, you can increase this parameter and restart the BE. However, having too many transformation threads may increase IO pressure and affect other operations. This thread is shared with Rollup jobs.

- `alter_index_worker_count`: Number of threads used on the BE side for building indexes on historical data (currently only supports inverted indexes). The default is 3. If you want to speed up Index Change jobs, you can increase this parameter and restart the BE. However, having too many threads may increase IO pressure and affect other operations.

## More Details

For more detailed syntax and best practices regarding Schema Change, please refer to the [ALTER TABLE COLUMN](../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-TABLE-COLUMN) command manual.