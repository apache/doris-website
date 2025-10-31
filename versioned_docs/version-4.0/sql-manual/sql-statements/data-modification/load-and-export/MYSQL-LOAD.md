---
{
    "title": "MYSQL LOAD",
    "language": "en"
}
---

## Description

Use the MySQL client to import local data files into Doris. MySQL Load is a synchronous import method, which returns the import result immediately after execution. You can determine whether the import is successful based on the return result of the `LOAD DATA` statement. MySQL Load can ensure the atomicity of a batch of import tasks, meaning that either all imports succeed or all fail.

## Syntax

```sql
LOAD DATA
[ LOCAL ]
INFILE "<file_name>"
INTO TABLE "<tbl_name>"
[ PARTITION (<partition_name> [, ... ]) ]
[ COLUMNS TERMINATED BY "<column_separator>" ]
[ LINES TERMINATED BY "<line_delimiter>" ]
[ IGNORE <number> {LINES | ROWS} ]
[ (<col_name_or_user_var> [, ... ] ) ]
[ SET (col_name={<expr> | DEFAULT} [, col_name={<expr> | DEFAULT}] ...) ]
[ PROPERTIES ("<key>" = "<value>" [ , ... ]) ]
```

## Required Parameters

**1. `<file_name>`**

> Specify the path of the local file, which can be either a relative or an absolute path. Currently, only a single file is supported, and multiple files are not supported.

**2. `<tbl_name>`**

> The table name can include the database name, as shown in the examples. If the database name is omitted, the current user's database will be used.

## Optional Parameters

**1. `LOCAL`**

> Specifying `LOCAL` indicates reading files from the client. Omitting it means reading files from the local storage of the FE server. The function of importing files from the FE server is disabled by default. You need to set `mysql_load_server_secure_path` on the FE node to specify a secure path to enable this function.

**2. `<partition_name>`**

> Multiple partitions can be specified for import, separated by commas.

**3. `<column_separator>`**

> Specify the column separator.

**4. `<line_delimiter>`**

> Specify the line delimiter.

**5. `IGNORE <number> { LINES | ROWS }`**

> Users can skip the header of the CSV file or any number of lines. This syntax can also be replaced with `IGNORE num ROWS`.

**6. `<col_name_or_user_var>`**

> Column mapping syntax. For specific parameters, refer to the column mapping section of [Data Transformation during Import](../../../../data-operate/import/import-way/mysql-load-manual.md).

**7.  `properties ("<key>"="<value>",...)`**  

| Parameter | Parameter Description |
| ---------------------- | ------------------------------------------------------------ |
| max_filter_ratio | The maximum tolerable ratio of filterable data (due to reasons such as data irregularities), with a default of zero tolerance. |
| timeout | Specify the import timeout period in seconds. The default is 600 seconds, and the valid range is from 1 second to 259,200 seconds. |
| strict_mode | Users can specify whether to enable strict mode for this import. The default is disabled. |
| timezone | Specify the time zone for this import. The default is the East Eight Time Zone. This parameter will affect the results of all time - zone - related functions involved in the import. |
| exec_mem_limit | The import memory limit, with a default of 2GB in bytes. |
| trim_double_quotes | A boolean type with a default value of `false`. When set to `true`, it means trimming the outermost double quotes of each field in the imported file. |
| enclose | Enclosure character. When a CSV data field contains a line separator or column separator, to prevent accidental truncation, a single - byte character can be specified as the enclosure character for protection. For example, if the column separator is ",", the enclosure character is "'", and the data is "a,'b,c'", then "b,c" will be parsed as one field. Note: When `enclose` is set to `""`, `trim_double_quotes` must be set to `true`. |
| escape | Escape character. Used to escape characters in the CSV field that are the same as the enclosure character. For example, if the data is "a,'b,'c'", the enclosure character is "'", and you want "b,'c" to be parsed as one field, you need to specify a single - byte escape character, such as "", and then modify the data to "a,'b,'c'". |

## Access Control Requirements

Users executing this SQL command must have at least the following permissions:

| Privilege | Object | Notes |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | Table | Import permissions for the specified database table. |

## Usage Notes

- The MySQL Load statement starts with the syntax `LOAD DATA` and does not require specifying a LABEL.

## Examples

1. Import data from the client's local file `testData` into the table `testTbl` in the database `testDb`. Specify a timeout of 100 seconds.

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("timeout"="100")
    ```

2. Import data from the server's local file `/root/testData` (you need to set the FE configuration `mysql_load_server_secure_path` to `/root`) into the table `testTbl` in the database `testDb`. Specify a timeout of 100 seconds.

    ```sql
    LOAD DATA
    INFILE '/root/testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("timeout"="100")
    ```

3. Import data from the client's local file `testData` into the table `testTbl` in the database `testDb`, allowing an error rate of 20%.

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("max_filter_ratio"="0.2")
    ```

4. Import data from the client's local file `testData` into the table `testTbl` in the database `testDb`, allowing an error rate of 20%, and specify the column names of the file.

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    (k2, k1, v1)
    PROPERTIES ("max_filter_ratio"="0.2")
    ```

5. Import data from the local file `testData` into partitions `p1` and `p2` of the table `testTbl` in the database `testDb`, allowing an error rate of 20%.

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PARTITION (p1, p2)
    PROPERTIES ("max_filter_ratio"="0.2")
    ```

6. Import data from the local CSV file `testData` with a line separator of `0102` and a column separator of `0304` into the table `testTbl` in the database `testDb`.

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    COLUMNS TERMINATED BY '0304'
    LINES TERMINATED BY '0102'
    ```

7. Import data from the local file `testData` into partitions `p1` and `p2` of the table `testTbl` in the database `testDb` and skip the first 3 lines.

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PARTITION (p1, p2)
    IGNORE 3 LINES
    ```

8. Import data with strict mode filtering and set the time zone to `Africa/Abidjan`.

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("strict_mode"="true", "timezone"="Africa/Abidjan")
    ```

9. Limit the import memory to 10GB and set a timeout of 10 minutes for the data import.

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("exec_mem_limit"="10737418240", "timeout"="600")
    ```