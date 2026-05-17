---
{
    "title": "MYSQL LOAD",
    "language": "en",
    "description": "Use the MySQL client to import local data files into Doris. MySQL Load is a synchronous import method,"
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
| timezone | Specify the time zone for this import. The default is the current cluster time zone. This parameter will affect the results of all time - zone - related functions involved in the import. |
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

For complete examples covering local file import, partition selection, column mapping, strict mode, and more, refer to [MySQL Load](../../../../data-operate/import/import-way/mysql-load-manual.md) in the Data Import guide.