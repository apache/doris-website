---
{
    "title": "MySQL Load",
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

Apache Doris is compatible with the MySQL protocol and supports the use of the standard MySQL [LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html) syntax to import local files. MySQL Load is a synchronous import method where the import result is returned upon completion. That means users can tell whether the import suceeds from the returned result. Generally, the MySQL Load method can be used to ingest files smaller than 10GB in size. For files larger than 10GB, it is recommended to split them into smaller ones. MySQL Load ensures the atomicity of a batch of import tasks, meaning that either all imports succeed or all imports fail.

## Applicable scenarios

**Supported format**

MySQL Load is primarily designed for importing CSV files from the client's local machine or importing data from data streams through programs.

**Restrictions**

When importing CSV files, it is important to differentiate between null values and empty strings (''):

- Null values are represented by the escape sequence \N. For example, in `a,\N,b`, the middle column represents a null value.
- Empty strings are represented directly as empty, such as `a, ,b`, where the middle column represents an empty string.

## Implementation

MySQL Load is similar to Stream Load in terms of functionality. They both involve importing local files into the Doris cluster. Therefore, the implementation of MySQL Load reuses the basic import capabilities of Stream Load.

The main processes of MySQL Load include:

1. The user submits a LOAD DATA request to the frontend (FE), which performs the parsing and encapsulates the request into a Stream Load task.
2. The FE selects a backend (BE) node and sends the Stream Load request to it.
3. Meanwhile, the FE reads the local file data from the MySQL client in an asynchronous and streaming manner and sends it in real time to the HTTP request of the Stream Load.
4. Once the data transfer from the MySQL client is complete, the FE waits for the Stream Load to finish and displays the import result (success or failure) to the client.

## Get started

### Preparations

MySQL Load requires INSERT permission on the target table. You can grant permissions to user account using the GRANT command.

### Create a MySQL Load job

1. Prepare the test data

Create a data file `client_local.csv` containing the following sample data:

```SQL
1,10
2,20
3,30
4,40
5,50
6,60
```

2. Connect to MySQL client

Connect to the MySQL client before executing the LOAD DATA command:

```Shell
mysql --local-infile  -h <fe_ip> -P <fe_query_port> -u root -D testdb
```

:::caution
Specific parameter options need to be used during the connection:

1. When connecting to the MySQL client, `--local-infile` must be included, otherwise an error might be thrown.
2. When connecting via JDBC, `allowLoadLocalInfile=true` must be specified in the URL.
:::

3. Create the test table

Create a table as follows in Doris:

```SQL
CREATE TABLE testdb.t1 (
    pk     INT, 
    v1     INT SUM
) AGGREGATE KEY (pk) 
DISTRIBUTED BY hash (pk);
```

4. Run the LOAD DATA command

After connecting to the MySQL client, create a Load job. The command is as follows:

```SQL
LOAD DATA LOCAL
INFILE 'client_local.csv'
INTO TABLE testdb.t1
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

### View results

MySQL Load is a synchronous import method, and the results of the import are returned to the user in the command-line interface. If the import execution fails, it will display specific error messages.

Below is an example of a successful import result, which returns the number of imported rows:

```SQL
Query OK, 6 row affected (0.17 sec)
Records: 6  Deleted: 0  Skipped: 0  Warnings: 0
```

When there are exceptions during the import, the corresponding error will be displayed on the client:

```SQL
ERROR 1105 (HY000): errCode = 2, detailMessage = [DATA_QUALITY_ERROR]too many filtered rows with load id b612907c-ccf4-4ac2-82fe-107ece655f0f
```

The `loadId` is included in the error message, based on which you can view the detailed information via the `show load warnings` command:

```SQL
show load warnings where label='b612907c-ccf4-4ac2-82fe-107ece655f0f';
```

### Cancel a MySQL Load job

Doris does not allow manual cancellation of MySQL Load jobs. In the event of a timeout or import error, the corresponding MySQL Load job will be automatically cancelled by the system.

## Manual

### Syntax

The syntax for LOAD DATA is as follows:

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

Descriptions of modules in the Load job:

| Module                | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| INFILE                | This specifies the local file path, which can be either a relative path or an absolute path.Currently, load_data_file only supports a single file. |
| INTO TABLE            | This specifies the database and table, and the database name can be omitted. |
| PARTITION             | This specifies the target partition. If the user can determine the partition corresponding to the data, it is recommended to specify this. Data that does not fit into the specified partitions will be filtered out. |
| COLUMNS TERMINATED BY | This specifies the column delimiter.                         |
| LINE TERMINATED BY    | This specifies the row delimiter.                            |
| IGNORE num LINES      | This specifies the number of rows to skip in the CSV import, typically specified as 1 to skip the header. |
| col_name_or_user_var  | This specifies the column mapping syntax. For more information, refer to [Column Mapping](https://doris.apache.org/docs/2.0/data-operate/import/load-data-convert#column-mapping). |
| PROPERTIES            | Parameters for the Load.                                     |

### Parameters

By the `PROPERTIES (key1 = value1 [, key2=value2])` syntax, you can configure the parameters for the Load. 

| Parameter          | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| max_filter_ratio   | The maximum filtering rate allowed. Must be between 0 and 1, inclusive. The default value is 0, indicating no tolerance for any error rows. |
| timeout            | The import timeout, measured in seconds. The default value is 600. The range allowed is from 1s to 259200s. |
| strict_mode        | Whether to enable strict mode for this import. Disabled by default. |
| timezone           | The time zone for this import. The default time zone is UTC+8. This parameter will affect the results of any time zone-related functions involved in the import. |
| exec_mem_limit     | Memory limit for the import, defaults to 2GB, measured in bytes. |
| trim_double_quotes | Boolean, defaults to false. If this is set to true, the outermost double quotes will be trimmed from each field in the import file. |
| enclose            | This specifies the enclosure character. When a CSV data field contains line breaks or column delimiters, you can specify a single-byte character as the enclosure character to prevent accidental truncation.For example, if the column delimiter is ",", and the enclosure character is "'", in data "a,'b,c'", "b,c" will be parsed as one field. |
| escape             | This specifies the escape character. This is used when the data contains the same character as the enclosure character, which needs to be treated as part of the field.For example, if the data is "a,'b,'c'", the enclosure character is "'", and you want "b,'c" to be parsed as one field, you need to specify a single-byte escape character, such as "\", to modify the data to "a,'b,\'c'". |

## Example

### Specify load timeout

You can adjust the import timeout by specifying `timeout` in PROPERTIES. For example, set it to 100s:

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("timeout"="100");
```

### Specify allowable error rate

You can adjust the allowable error rate by specifying `max_filter_ratio` in PROPERTIES. For example, set it to 20%:

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("max_filter_ratio"="0.2");
```

### Import column mapping

The following example adjusts the order of columns in the CSV file.

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
(k2, k1, v1);
```

### Specify column and row delimiters

You can specify the column and row delimiters using the `COLUMNS TERMINATED BY` and `LINES TERMINATED BY` clauses. In the following example, (,) and (\n) are used as the column and row delimiters, respectively.

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

### Specify target partition

You can specify the target partition for the import using the `PARTITION` clause. In the following example, data will be loaded into the specified partitions 'p1' and 'p2', and any data that does not belong to these two partitions will be filtered out:

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PARTITION (p1, p2);
```

### Specify time zone

You can specify the `timezone` in PROPERTIES. In the following example, the timezone is set to Africa/Abidjan:

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("timezone"="Africa/Abidjan");
```

### Specify the memory limit for the import

You can specify the memory limit for the import by the `exec_mem_limit` parameter in PROPERTIES. In the following example, the memory limit is set to 10G:

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("exec_mem_limit"="10737418240");
```

## More help

For more detailed syntax and best practices related to MySQL Load, refer to the [MySQL Load](../../../sql-manual/sql-statements/data-modification/load-and-export/MYSQL-LOAD/) command manual.
