---
{
    "title": "MySQL Load",
    "language": "en",
    "description": "Use the MySQL standard LOAD DATA syntax to synchronously import local CSV files into Doris. Suitable for files under 10 GB, with batch atomicity guaranteed.",
    "keywords": [
        "MySQL Load",
        "LOAD DATA",
        "local file import",
        "CSV import",
        "Doris synchronous import",
        "local-infile",
        "allowLoadLocalInfile",
        "Stream Load"
    ]
}
---

<!-- Knowledge type: Operational steps + Configuration parameters -->
<!-- Applicable scenarios: Client-side local CSV file import / Program data stream import -->

Doris is compatible with the MySQL protocol, so you can use the MySQL standard [LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html) syntax to import local files. MySQL Load is a **synchronous import method**: the import result is returned as soon as the import finishes, and you can determine whether the import succeeded from the return value of the LOAD DATA statement.

In general, you can use MySQL Load to import files under 10 GB. If the file is too large, split it first and then use MySQL Load to import the parts. MySQL Load guarantees the **atomicity** of a batch import task: either all rows are imported successfully, or none are.

## Use cases

### Applicable scenarios

MySQL Load is mainly applicable to the following scenarios:

- Importing **local CSV files** from the client into Doris.
- Importing data from a **data stream** through a program.

### Limitations

When importing CSV files, you must clearly distinguish between **null values (null)** and **empty strings (`''`)**:

| Data type    | Representation     | Example data | Description                                |
| ------------ | ------------------ | ------------ | ------------------------------------------ |
| Null (null)  | `\N`               | `a,\N,b`     | The middle column is a null value.         |
| Empty string | Leave it empty     | `a, ,b`      | The middle column is an empty string.      |

## Basic principles

MySQL Load is functionally similar to Stream Load: both import local files into a Doris cluster. As a result, the implementation of MySQL Load reuses the basic import capability of Stream Load.

The main execution flow of MySQL Load is as follows:

1. The user submits a LOAD DATA request to the FE. The FE parses the request and wraps it as a Stream Load.
2. The FE selects a BE node and sends the Stream Load request.
3. While sending the request, the FE asynchronously and in a streaming manner reads local file data from the MySQL client and sends it in real time into the HTTP request of the Stream Load.
4. After the MySQL client finishes transmitting the data, the FE waits for Stream Load to complete and returns the success or failure information of the import to the client.

## Quick start

### Pre-checks

Before running MySQL Load, make sure the following conditions are met:

- The current user has the **INSERT privilege** on the target table. If the user does not have the INSERT privilege, you can grant it with the `GRANT` command.

### Create an import job

Follow the four steps below to complete a full MySQL Load import.

#### 1. Prepare test data

Create a file named `client_local.csv` with the following sample data:

```sql
1,10
2,20
3,30
4,40
5,50
6,60
```

#### 2. Connect the client

Before running the LOAD DATA command, connect the MySQL client first:

```Shell
mysql --local-infile  -h <fe_ip> -P <fe_query_port> -u root -D testdb
```

:::caution
When running MySQL Load, the client connection must use the specified parameter options:

1. When connecting with the MySQL client, you must use the `--local-infile` option, otherwise an error may be reported.
2. When connecting through JDBC, you need to specify `allowLoadLocalInfile=true` in the URL.
:::

#### 3. Create a test table

Create the following table in Doris:

```sql
CREATE TABLE testdb.t1 (
    pk     INT, 
    v1     INT SUM
) AGGREGATE KEY (pk) 
DISTRIBUTED BY hash (pk);
```

#### 4. Run the LOAD DATA import command

After connecting the MySQL client, create an import job with the following command:

```sql
LOAD DATA LOCAL
INFILE 'client_local.csv'
INTO TABLE testdb.t1
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

### View the import job result

MySQL Load is a synchronous import method, so the import result is returned directly to the user on the command line. If the import fails, the specific error message is shown.

When the import **succeeds**, the number of imported rows is returned:

```sql
Query OK, 6 rows affected (0.17 sec)
Records: 6  Deleted: 0  Skipped: 0  Warnings: 0
```

When the import **fails**, the client shows the corresponding error:

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = [DATA_QUALITY_ERROR]too many filtered rows with load id b612907c-ccf4-4ac2-82fe-107ece655f0f
```

The error message contains the `loadId` of this import. You can use the `show load warnings` command to view the details:

```sql
show load warnings where label='b612907c-ccf4-4ac2-82fe-107ece655f0f';
```

### Cancel an import job

Users **cannot manually cancel** a MySQL Load. MySQL Load is automatically canceled by the system after a timeout or an import error.

## Reference

### Import syntax

The complete LOAD DATA syntax is as follows:

```SQL
LOAD DATA LOCAL
INFILE '<load_data_file>'
INTO TABLE [<db_name>.]<table_name>
[PARTITION (partition_name [, partition_name] ...)]
[COLUMNS TERMINATED BY '<column_terminated_operator>']
[LINES TERMINATED BY '<line_terminated_operator>']
[IGNORE <ignore_lines> LINES]
[(col_name_or_user_var[, col_name_or_user_var] ...)]
[SET col_name={expr | DEFAULT}[, col_name={expr | DEFAULT}] ...]
[PROPERTIES (key1 = value1 [, key2=value2]) ]
```

The descriptions of each clause are as follows:

| Clause                | Description                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| INFILE                | Specifies the local file path. It can be a relative or absolute path. Currently, `load_data_file` supports importing only a single file. |
| INTO TABLE            | Specifies the database name and table name. The database name can be omitted.                                                            |
| PARTITION             | Specifies the partitions to import into. If you can determine the partition each row belongs to, specifying this is recommended. Rows that do not match these partitions are filtered out. |
| COLUMNS TERMINATED BY | Specifies the column delimiter for the import.                                                                                           |
| LINE TERMINATED BY    | Specifies the line delimiter for the import.                                                                                             |
| IGNORE num LINES      | Specifies the number of lines to skip in the imported CSV. This is typically set to 1 to skip the header.                                |
| col_name_or_user_var  | Specifies the column mapping syntax. For data conversion, see the [Column mapping](../../../data-operate/import/load-data-convert#column-mapping) section. |
| PROPERTIES            | Import parameters.                                                                                                                       |

### Import parameters

The `PROPERTIES (key1 = value1 [, key2=value2])` syntax lets you specify import parameter configurations:

| Parameter          | Description                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| max_filter_ratio   | The maximum allowed filter ratio. Must be between 0 and 1, inclusive. The default value is 0, which means no error rows are tolerated.                                                                                   |
| timeout            | The import timeout, in seconds. The default is 600 seconds. The valid range is 1s to 259200s.                                                                                                                            |
| strict_mode        | Whether strict mode is enabled for this import. Disabled by default.                                                                                                                                                     |
| timezone           | The time zone used for this import. The default is the current cluster time zone. This parameter affects the results of all time-zone-related functions involved in the import.                                          |
| exec_mem_limit     | The memory limit for the import. The default is 2 GB. The unit is bytes.                                                                                                                                                 |
| trim_double_quotes | Boolean type. The default value is false. When set to true, the outermost double quotes of each field in the imported file are trimmed.                                                                                  |
| enclose            | Specifies an enclosing character. When CSV data fields contain a line or column delimiter, a single-byte character can be specified as the enclosing character to prevent unintended truncation. For example, if the column delimiter is `,`, the enclosing character is `'`, and the data is `a,'b,c'`, then `b,c` is parsed as a single field. |
| escape             | Specifies an escape character. Used to escape characters in fields that are the same as the enclosing character. For example, if the data is `a,'b,'c'`, the enclosing character is `'`, and you want `b,'c` to be parsed as a single field, you need to specify a single-byte escape character such as `\` and modify the data to `a,'b,\'c'`. |

## Import examples

The following examples cover common import scenarios.

### Specify the import timeout

The PROPERTIES parameter `timeout` adjusts the import timeout. The following example sets the timeout to 100 seconds:

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("timeout"="100");
```

### Specify the allowed import error ratio

The PROPERTIES parameter `max_filter_ratio` adjusts the import error tolerance. The following example sets the error tolerance to 20%:

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("max_filter_ratio"="0.2");
```

### Map import columns

The following example adjusts the order of the columns in the CSV:

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
(k2, k1, v1);
```

### Specify the column and line delimiters

The `COLUMNS TERMINATED BY` and `LINES TERMINATED BY` clauses specify the column and line delimiters for the import. The following example uses comma (`,`) and newline (`\n`) as the column and line delimiters:

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

### Specify the import partitions

The `PARTITION` clause specifies the partitions to import into. The following example imports data into partitions `p1` and `p2`. Data that does not belong to partitions `p1` or `p2` is filtered out:

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PARTITION (p1, p2);
```

### Specify the import time zone

The PROPERTIES parameter `timezone` specifies the time zone. The following example sets the time zone to `Africa/Abidjan`:

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("timezone"="Africa/Abidjan");
```

### Limit the import memory

The PROPERTIES parameter `exec_mem_limit` specifies the memory limit for the import. The following example sets the import memory limit to 10 GB:

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("exec_mem_limit"="10737418240");
```

## FAQ

<!-- Knowledge type: Troubleshooting -->

### Q1: When running LOAD DATA, the error `The used command is not allowed with this MySQL version` is reported. What should I do?

This error is usually caused by the client not enabling the `local-infile` option. Handle it as follows:

- Command-line connection: Add the `--local-infile` parameter explicitly when connecting.
- JDBC connection: Append `allowLoadLocalInfile=true` to the URL.

### Q2: How large a file can MySQL Load import?

Importing files **under 10 GB** is recommended. If the file is too large, split it first and then use MySQL Load to import the parts.

### Q3: Does MySQL Load support manual cancellation?

**No.** MySQL Load is automatically canceled by the system after a timeout or an import error.

### Q4: How do I find the specific cause when an import fails?

Get the `loadId` from the error message, then run the following command to view the detailed error information:

```sql
show load warnings where label='<loadId>';
```

### Q5: How do I distinguish null values from empty strings in CSV?

- Null (null): Use `\N`, for example `a,\N,b`.
- Empty string: Leave it empty, for example `a, ,b`.

### Q6: Does the import guarantee atomicity?

Yes. MySQL Load guarantees the atomicity of a batch import task: either all rows are imported successfully, or none are.

## More help

For more detailed syntax and best practices for MySQL Load, see the [MySQL Load](../../../sql-manual/sql-statements/data-modification/load-and-export/MYSQL-LOAD) command reference.
