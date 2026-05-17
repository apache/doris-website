---
{
    "title": "Schema Change",
    "language": "en",
    "description": "Doris modifies table schemas through ALTER TABLE. This article describes the differences between lightweight and heavyweight Schema Change, usage examples, supported type conversions, and job management.",
    "keywords": [
        "Doris Schema Change",
        "ALTER TABLE",
        "lightweight Schema Change",
        "heavyweight Schema Change",
        "add column",
        "drop column",
        "modify column type",
        "VARCHAR length modification",
        "column reordering",
        "data type conversion"
    ]
}
---

<!-- Knowledge type: Operation steps / Configuration parameters / Limitations -->
<!-- Applicable scenarios: Table schema change / Field adjustment / Type conversion -->

You can modify the schema of a Doris table through [`ALTER TABLE`](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN.md). This article focuses on **column-related** schema changes. For index-related changes, refer to [Table Index](./index/index-overview.md) for the modification methods of different indexes.

## Two Types of Schema Change

Doris supports two types of Schema Change operations: **lightweight** and **heavyweight**. The two differ significantly in execution complexity, speed, and resource consumption. Before choosing, you can refer to the table below for a quick decision:

| Feature                  | Lightweight Schema Change                                    | Heavyweight Schema Change                                                            |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Execution speed          | Seconds (almost real-time)                                   | Minutes / hours / days (depends on data volume; the larger the volume, the slower)   |
| Requires data rewrite    | No, only metadata is modified                                | Yes, involves rewriting data files                                                   |
| System performance impact | Small impact                                                 | May affect system performance, especially during data conversion                     |
| Resource consumption     | Low                                                          | High, occupies compute resources; storage usage of table data doubles during the process |
| Typical operations       | Add / drop value columns, rename columns, modify VARCHAR length | Modify column data types, change primary keys, modify column order, etc.            |

### Lightweight Schema Change

**Only modifies metadata, without involving physical modification of data files.** It typically completes in seconds and has minimal impact on system performance. It includes:

- Adding or dropping value columns.
- Renaming columns.
- Modifying the length of VARCHAR columns (except key columns of UNIQUE and DUP tables).

### Heavyweight Schema Change

**Involves rewriting or converting data files**, with the actual modification or reorganization performed by the Backend (BE) in the background. All operations not in the lightweight category are heavyweight, for example:

- Modifying the data type of a column.
- Modifying the sort order of columns.

Execution flow:

1. The background starts a data conversion job, rewriting the original data into new data files in units of tablets.
2. During conversion, "double writing" occurs: new data is written to both the new tablet and the old tablet.
3. After conversion completes, the old tablet is deleted, and the new tablet takes over.

## Usage Examples

The table below lists common operation scenarios and the corresponding entry points. Refer to them as needed:

| User scenario              | Operation syntax    |
| -------------------------- | ------------------- |
| Rename a column            | `RENAME COLUMN`     |
| Add a key/value column     | `ADD COLUMN`        |
| Add multiple columns at once | `ADD COLUMN (...)` |
| Drop a column              | `DROP COLUMN`       |
| Modify column type / position | `MODIFY COLUMN`  |
| Reorder columns            | `ORDER BY`          |

### Rename a Column

```sql
ALTER TABLE [database.]table RENAME COLUMN old_column_name new_column_name;
```

For specific syntax, refer to [ALTER TABLE RENAME](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-RENAME.md).

### Add a Column

Notes:

- When adding a value column to an aggregate model, you must specify `agg_type`.
- When adding a key column to a non-aggregate model (such as DUPLICATE KEY), you must specify the `KEY` keyword.

#### Example 1: Adding a Column to a Non-Aggregate Table

1. Table creation statement:

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

2. Add the key column `key_col` after `col1`:

    ```sql
    ALTER TABLE example_db.my_table ADD COLUMN key_col INT KEY DEFAULT "0" AFTER col1;
    ```

3. Add the value column `value_col` after `col4`:

    ```sql
    ALTER TABLE example_db.my_table ADD COLUMN value_col INT DEFAULT "0" AFTER col4;
    ```

#### Example 2: Adding a Column to an Aggregate Table

1. Table creation statement:

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

2. Add the key column `key_col` after `col1`:

    ```sql
    ALTER TABLE example_db.my_table ADD COLUMN key_col INT DEFAULT "0" AFTER col1;
    ```

3. Add the value column `value_col` after `col4` with the SUM aggregate type:

    ```sql
    ALTER TABLE example_db.my_table ADD COLUMN value_col INT SUM DEFAULT "0" AFTER col4;
    ```

### Add Multiple Columns

Notes:

- When adding value columns to an aggregate model, you must specify `agg_type`.
- When adding key columns to an aggregate model, you must specify the `KEY` keyword.

Add multiple columns to an aggregate table:

1. Table creation statement:

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

2. Add multiple columns at once:

    ```sql
    ALTER TABLE example_db.my_table
    ADD COLUMN (c1 INT DEFAULT "1", c2 FLOAT SUM DEFAULT "0");
    ```

### Drop a Column

Notes:

- Partition columns cannot be dropped.
- Key columns of a UNIQUE table cannot be dropped.

Drop a column from `example_db.my_table`:

1. Table creation statement:

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

2. Drop the `col4` column from `example_db.my_table`:

    ```sql
    ALTER TABLE example_db.my_table DROP COLUMN col4;
    ```

### Modify Column Type and Position

Notes:

- When modifying a value column in an aggregate model, you must specify `agg_type`.
- When modifying a key column in a non-aggregate model, you must specify the `KEY` keyword.
- You can only modify the type of a column. Other column attributes must remain unchanged.
- **Partition columns and bucketing columns cannot be modified in any way.**
- Pay attention to precision loss when modifying columns. For supported type conversions, see [Supported Type Conversions](#supported-type-conversions) below.

Example:

1. Table creation statement:

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

2. Change the type of the key column `col1` to `BIGINT` and move it after `col2` (whether modifying a key column or a value column, you must declare the complete column information):

    ```sql
    ALTER TABLE example_db.my_table
    MODIFY COLUMN col1 BIGINT KEY DEFAULT "1" AFTER col2;
    ```

3. Modify the maximum length of the `col5` column in the base table. The original `col5` is `VARCHAR(32) REPLACE DEFAULT "abc"` (you can only modify the column type; other attributes must remain unchanged):

    ```sql
    ALTER TABLE example_db.my_table
    MODIFY COLUMN col5 VARCHAR(64) REPLACE DEFAULT "abc";
    ```

4. Modify the length of a field in a key column:

    ```sql
    ALTER TABLE example_db.my_table
    MODIFY COLUMN col3 varchar(50) KEY NULL COMMENT 'to 50';
    ```

#### Supported Type Conversions

Pay attention to precision loss when modifying column types. The following conversions are currently supported:

| Source type                                              | Target type                                       | Description                                                                                |
| -------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE        | A numeric type with a larger range                | -                                                                                          |
| TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE/DECIMAL | VARCHAR                                           | -                                                                                          |
| VARCHAR                                                  | VARCHAR                                           | Only modifying the maximum length is supported                                             |
| VARCHAR/CHAR                                             | TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE | -                                                                                          |
| VARCHAR/CHAR                                             | DATE                                              | Six formats are supported: `%Y-%m-%d`, `%y-%m-%d`, `%Y%m%d`, `%y%m%d`, `%Y/%m/%d`, `%y/%m/%d` |
| DATETIME                                                 | DATE                                              | Only year-month-day is retained, for example, `2019-12-09 21:47:05` becomes `2019-12-09`   |
| DATE                                                     | DATETIME                                          | Hours, minutes, and seconds are automatically padded with zeros, for example, `2019-12-09` becomes `2019-12-09 00:00:00` |
| FLOAT                                                    | DOUBLE                                            | -                                                                                          |
| INT                                                      | DATE                                              | If the INT data is invalid, the conversion fails and the original data remains unchanged  |
| Types other than DATE and DATETIME                       | STRING                                            | STRING cannot be converted to any other type                                               |

### Reorder Columns

Notes:

- All columns in the table must be listed.
- Value columns must be placed after key columns.

Example:

1. Table creation statement:

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

2. Reorder the columns in `example_db.my_table`:

    ```sql
    ALTER TABLE example_db.my_table
    ORDER BY (k3, k1, k2, k4, v2, v1);
    ```

## Job Management

### View Jobs

Use the [`SHOW ALTER TABLE COLUMN`](../sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE.md) command to view the progress of Schema Change jobs. It shows jobs that are currently running or have completed. When a job involves materialized views, this command displays multiple rows, one for each materialized view. Example:

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

When the job state is not `FINISHED` or `CANCELLED`, you can cancel a Schema Change job with the following command:

```sql
CANCEL ALTER TABLE COLUMN FROM tbl_name;
```

## Limitations

| Category               | Limitation                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Concurrency**        | A single table can have only one Schema Change job running at a time                                                             |
| **Immutable columns**  | Partition columns and bucketing columns cannot be modified                                                                       |
| **Key column deletion** | When an aggregate table contains value columns aggregated with REPLACE, key columns cannot be deleted; key columns of a Unique table also cannot be deleted |
| **Aggregate default value** | When adding a SUM or REPLACE type value column, because the historical data has lost its detail information, the default value cannot actually reflect the post-aggregation value and is meaningless for historical data |
| **Type modification**  | Only the column type can be modified; other fields such as the aggregation method, Nullable, and default value must be filled in according to the original column information |
| **Unsupported modifications** | Modifying the aggregation type, Nullable attribute, and default value is not supported                                  |

## Related Configuration

### FE Configuration

| Configuration item           | Default value | Description                |
| ---------------------------- | ------------- | -------------------------- |
| `alter_table_timeout_second` | 86400 (seconds) | Default timeout for jobs |

### BE Configuration

| Configuration item          | Default value | Description                                                                                                          |
| --------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `alter_tablet_worker_count` | 3             | The number of threads on the BE side used to convert historical data. You can increase this value appropriately to speed up Schema Change jobs, but too many threads may increase IO pressure and affect other operations |
| `alter_index_worker_count`  | 3             | The number of threads on the BE side used to build indexes on historical data (currently only inverted indexes are supported). Adjustment recommendations are the same as above |

> After adjusting BE configuration, BE must be restarted for the changes to take effect.
