---
{
    "title": "Schema Change",
    "language": "en"
}
---

Users can modify the schema of Doris tables through the [Alter Table](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN.md) operation. Schema changes mainly involve column modifications and index changes. This article mainly introduces column-related schema changes; for index-related changes, please refer to [Table Index](./index/index-overview.md) to understand the different methods of changing indexes.

## Principles Introduction

Doris supports two types of schema change operations: lightweight schema change and heavyweight schema change. The differences mainly lie in the complexity of the execution process, execution speed, and resource consumption.

| Feature             | Lightweight Schema Change | Heavyweight Schema Change |
|---------------------|---------------------------|---------------------------|
| Execution Speed      | Seconds (almost real-time) | Minutes, hours, days (depends on the amount of data in the table; the larger the data, the slower the execution) |
| Data Rewrite Needed  | No                        | Yes, involves rewriting data files |
| System Performance Impact | Minimal               | May impact system performance, especially during data conversion |
| Resource Consumption  | Low                       | High, will consume computing resources to reorganize data, and the storage space occupied by the table's data involved in the process will double. |
| Operation Types      | Add, delete value columns, rename columns, modify VARCHAR length | Modify column data types, change primary keys, modify column order, etc. |

### Lightweight Schema Change

Lightweight schema change refers to simple schema modification operations that do not involve data rewriting. These operations are usually performed at the metadata level and only require modifying the table's metadata without involving physical modifications to data files. Lightweight schema change operations can typically be completed in seconds and do not significantly impact system performance. Lightweight schema changes include:

- Adding or deleting value columns
- Renaming columns
- Modifying the length of VARCHAR columns (except for UNIQUE and DUP table key columns).

### Heavyweight Schema Change

Heavyweight schema change involves rewriting or converting data files, and these operations are relatively complex, usually requiring the assistance of Doris's Backend (BE) to perform actual data modifications or reorganizations. Heavyweight schema change operations typically involve deep changes to the table's data structure and may affect the physical layout of storage. All operations that do not support lightweight schema changes fall under heavyweight schema changes, such as:

- Changing the data type of a column
- Modifying the order of columns

Heavyweight operations will start a task in the background for data conversion. The background task will convert each tablet of the table, rewriting the original data into new data files on a tablet basis. During the data conversion process, a "double write" phenomenon may occur, where new data is simultaneously written to both the new tablet and the old tablet. After the data conversion is complete, the old tablet will be deleted, and the new tablet will replace it.

## Job Management
### View Jobs

Users can view the progress of schema change jobs through the [`SHOW ALTER TABLE COLUMN`](../sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE.md) command. This command allows users to see the currently executing or completed schema change jobs. When a schema change job involves materialized views, this command will display multiple rows, each corresponding to a materialized view. An example is as follows:

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

### Cancel Jobs

If the job status is not FINISHED or CANCELLED, you can cancel the schema change job using the following command:

```sql
CANCEL ALTER TABLE COLUMN FROM tbl_name;
```

## Usage Examples

### Rename Column

```sql
ALTER TABLE [database.]table RENAME COLUMN old_column_name new_column_name;
```
For specific syntax, refer to [ALTER TABLE RENAME](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-RENAME).

### Add a Column

- If an aggregate model adds a value column, the `agg_type` must be specified.

- If a non-aggregate model (such as DUPLICATE KEY) adds a key column, the KEY keyword must be specified.

*Adding a column to a non-aggregate table*

1. Create table statement

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col1 int,
    col2 int,
    col3 int,
    col4 int,
    col5 int
) DUPLICATE KEY(col1, col2, col3)
DISTRIBUTED BY RANDOM BUCKETS 10;
```

2. Add a key column `key_col` after `col1` in `example_db.my_table`

```sql
ALTER TABLE example_db.my_table ADD COLUMN key_col INT KEY DEFAULT "0" AFTER col1;
```

3. Add a value column `value_col` after `col4` in `example_db.my_table`

```sql
ALTER TABLE example_db.my_table ADD COLUMN value_col INT DEFAULT "0" AFTER col4;
```

*Adding a column to an aggregate table*

1. Create table statement

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col1 int,
    col2 int,
    col3 int,
    col4 int SUM,
    col5 varchar(32) REPLACE DEFAULT "abc"
) AGGREGATE KEY(col1, col2, col3)
DISTRIBUTED BY HASH(col1) BUCKETS 10;
```

2. Add a key column `key_col` after `col1` in `example_db.my_table`

```sql
ALTER TABLE example_db.my_table ADD COLUMN key_col INT DEFAULT "0" AFTER col1;
```

3. Add a value column `value_col` of SUM aggregation type after `col4` in `example_db.my_table`

```sql
ALTER TABLE example_db.my_table ADD COLUMN value_col INT SUM DEFAULT "0" AFTER col4;
```

### Add Multiple Columns

- If an aggregate model adds a value column, the `agg_type` must be specified.

- If an aggregate model adds a key column, the KEY keyword must be specified.

*Adding multiple columns to an aggregate table*

1. Create table statement

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col1 int,
    col2 int,
    col3 int,
    col4 int SUM,
    col5 varchar(32) REPLACE DEFAULT "abc"
) AGGREGATE KEY(col1, col2, col3)
DISTRIBUTED BY HASH(col1) BUCKETS 10;
```

2. Add multiple columns to `example_db.my_table` (aggregate model)

```sql
ALTER TABLE example_db.my_table
ADD COLUMN (c1 INT DEFAULT "1", c2 FLOAT SUM DEFAULT "0");
```

### Delete Column

- Partition columns cannot be deleted.

- UNIQUE key columns cannot be deleted.

To delete a column from `example_db.my_table`

1. Create table statement

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col1 int,
    col2 int,
    col3 int,
    col4 int SUM,
    col5 varchar(32) REPLACE DEFAULT "abc"
) AGGREGATE KEY(col1, col2, col3)
DISTRIBUTED BY HASH(col1) BUCKETS 10;
```

2. Delete the `col4` column from `example_db.my_table`

```sql
ALTER TABLE example_db.my_table DROP COLUMN col4;
```

### Modify Column Type and Position

- If an aggregate model modifies a value column, the `agg_type` must be specified.

- If a non-aggregate type modifies a key column, the **KEY** keyword must be specified.

- Only the type of the column can be modified; other attributes of the column must remain the same.

- Partition columns and bucket columns cannot be modified.

- The following type conversions are currently supported (users need to be aware of precision loss):

  - TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE types can be converted to larger numeric types.

  - TINTINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE/DECIMAL can be converted to VARCHAR.

  - VARCHAR supports modifying the maximum length.

  - VARCHAR/CHAR can be converted to TINTINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE.

  - VARCHAR/CHAR can be converted to DATE (currently supports six formats: "%Y-%m-%d", "%y-%m-%d", "%Y%m%d", "%y%m%d", "%Y/%m/%d", "%y/%m/%d").

  - DATETIME can be converted to DATE (only retains year-month-day information, e.g., `2019-12-09 21:47:05` <--> `2019-12-09`).

  - DATE can be converted to DATETIME (hours, minutes, and seconds are automatically set to zero, e.g., `2019-12-09` <--> `2019-12-09 00:00:00`).

  - FLOAT can be converted to DOUBLE.

  - INT can be converted to DATE (if the INT type data is invalid, the conversion fails, and the original data remains unchanged).

  - All types except DATE and DATETIME can be converted to STRING, but STRING cannot be converted to any other type.

1. Create table statement

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col0 int,
    col1 int DEFAULT "1",
    col2 int,
    col3 varchar(32),
    col4 int SUM,
    col5 varchar(32) REPLACE DEFAULT "abc"
) AGGREGATE KEY(col0, col1, col2, col3)
DISTRIBUTED BY HASH(col0) BUCKETS 10;
```

2. Modify the type of key column `col1` to BIGINT and move it after column `col2`

```sql
ALTER TABLE example_db.my_table 
MODIFY COLUMN col1 BIGINT KEY DEFAULT "1" AFTER col2;
```

Note: Whether modifying a key column or a value column, the complete column information must be declared.

3. Modify the maximum length of the `val1` column in the base table. The original `val1` was (val1 VARCHAR(32) REPLACE DEFAULT "abc")

```sql
ALTER TABLE example_db.my_table 
MODIFY COLUMN col5 VARCHAR(64) REPLACE DEFAULT "abc";
```

Note: Only the type of the column can be modified; other attributes of the column must remain the same.

4. Modify the length of a field in a key column

```sql
ALTER TABLE example_db.my_table
MODIFY COLUMN col3 varchar(50) KEY NULL comment 'to 50';
```

### Reorder

- All columns must be listed.
- Value columns must be after key columns.

1. Create table statement
```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    k1 int DEFAULT "1",
    k2 int,
    k3 varchar(32),
    k4 date,
    v1 int SUM,
    v2 int MAX,
) AGGREGATE KEY(k1, k2, k3, k4)
DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

2. Reorder the columns in `example_db.my_table`

```sql
ALTER TABLE example_db.my_table
ORDER BY (k3,k1,k2,k4,v2,v1);
```

## Limitations

- A table can only have one schema change job running at the same time.

- Partition columns and bucket columns cannot be modified.

- If an aggregate table has value columns aggregated using the REPLACE method, key columns cannot be deleted.

- Unique tables cannot delete key columns.

- When adding value columns with aggregation types of SUM or REPLACE, the default value of that column has no meaning for historical data.

- Because historical data has lost detailed information, the value of the default cannot actually reflect the aggregated value.

- When modifying column types, all fields except Type must be supplemented with the original column's information.

- Note that, except for the new column type, aggregation method, Nullable attribute, and default value must be supplemented according to the original information.

- Modifying aggregation types, Nullable attributes, and default values is not supported.

## Related Configurations

### FE Configuration

- `alter_table_timeout_second`: The default timeout for jobs, 86400 seconds.

### BE Configuration

- `alter_tablet_worker_count`: The number of threads used on the BE side to execute historical data conversion. The default is 3. If you want to speed up schema change jobs, you can appropriately increase this parameter and restart BE. However, too many conversion threads may increase IO pressure and affect other operations.

- `alter_index_worker_count`: The number of threads used on the BE side to execute historical data index building (Note: currently only supports inverted indexes). The default is 3. If you want to speed up index change jobs, you can appropriately increase this parameter and restart BE. However, too many threads may increase IO pressure and affect other operations.
