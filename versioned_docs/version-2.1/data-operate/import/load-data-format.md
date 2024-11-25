---
{
    "title": "Import Data Formats",
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

Doris supports importing data files in CSV, JSON, Parquet, and ORC formats. This document provides detailed information on the supported import methods, applicable parameters, and usage for each file format.

## CSV Format
### Supported Import Methods
The following import methods support data import in CSV format:
- [Stream Load](./import-way/stream-load-manual.md)
- [Broker Load](./import-way/broker-load-manual.md)
- [Routine Load](./import-way/routine-load-manual.md)
- [MySQL Load](./import-way/mysql-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../sql-manual/sql-functions/table-valued-functions/hdfs)

### Supported CSV Formats
- csv: File without header and type
- csv_with_names: File with header, automatically filters the first line of the file
- csv_with_names_and_types: File with header and type, automatically filters the first two lines of the file

### Applicable Parameters

| Parameter      | Description                                                  | Method                                                       |
| :------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Line Delimiter | Specifies the newline character in the import file, default is `\n`. Multiple characters can be used as a combination for the newline character. For text files on Windows systems, you may need to specify the newline character as `\r\n`. Some programs may use `\r` as the line terminator when writing files, in which case you need to specify `\r` as the newline character. Routine Load does not support specifying the line delimiter, as each message corresponds to a row of data. | <p>- Stream     Load: `line_delimiter` Http Header</p> <p>- Broker Load: `LINES TERMINATED BY`</p> <p>- Routine Load: Not supported</p>  <p>- MySQL Load: `LINES TERMINATED BY`</p> |
| Column Delimiter | Specifies the column delimiter in the import file, default is `\t`. If it is an invisible character, it needs to be prefixed with `\x` and represented in hexadecimal. Multiple characters can be used as a combination for the column delimiter. Because the MySQL protocol performs escape processing, if the column delimiter is an invisible character, an additional backslash `\` needs to be added before the column delimiter in the import request submitted through the MySQL protocol. For example, the file delimiter in Hive is `\x01`, and Broker Load needs to pass `\\x01`. | <p>- Stream     Load: `columns_delimiter` Http Header</p> <p>- Broker Load: `COLUMNS TERMINATED BY`</p> <p>- Routine Load: `COLUMNS TERMINATED BY`</p> <p>- MySQL Load: `COLUMNS TERMINATED BY`</p> |
| Enclose Character | When the CSV data field contains the line delimiter or column delimiter, to prevent accidental truncation, a single-byte character can be specified as the enclosing character for protection. The default value is `NONE`. The most commonly used enclosing characters are single quotes `'` or double quotes `"`. For example, if the column delimiter is `,` and the enclosing character is `'`, and the data is `a,'b,c'`, then `b,c` will be parsed as one field. | <p>- Stream     Load: `enclose` Http Header</p> <p>- Broker Load: Specify `enclose` in `PROPERTIES`</p> <p>- Routine Load: Specify `enclose` in `PROPERTIES`</p> <p>- MySQL Load: Specify `enclose` in `PROPERTIES`</p> |
| Escape Character | Used to escape the same character as the enclosing character that appears in the field. For example, if the data is `a,'b,'c'`, the enclosing character is `'`, and you want `b,'c` to be parsed as one field, you need to specify a single-byte escape character, such as `\`, and modify the data to `a,'b,\'c'`. | <p>- Stream     Load: `escape` Http Header</p> <p>- Broker Load: Specify `escape` in `PROPERTIES`</p> <p>- Routine Load: Specify `escape` in `PROPERTIES`</p> <p>- MySQL Load: Specify `escape` in `PROPERTIES`</p> |
| Skipped Lines | Skips the first few lines of the CSV file, integer type, default is 0. This parameter is ignored when the format is set to `csv_with_names` or `csv_with_names_and_types`. | <p>- Stream     Load: `skip_lines` Http Header</p> <p>- Broker Load: Specify `skip_lines` in `PROPERTIES`</p> <p>- MySQL Load: Not supported</p> <p>- Routine Load: Not supported</p> |
| Compression Format | The following compression formats are supported for CSV format data: plain, gz, lzo, bz2, lz4, LZ4FRAME, lzop, deflate. The default is plain, indicating no compression. Tar format is not supported, as tar is an archiving tool, not a compression format. | <p>- Stream     Load: `compress_type` Http Header</p> <p>- Broker Load: `COMPRESS_TYPE AS`</p> <p>- MySQL Load: Not supported</p> <p>- Routine Load: Not supported</p> |

#### Import Example

[Stream Load](./import-way/stream-load-manual.md) 

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "line_delimiter:\n" \
    -H "columns_delimiter:|" \
    -H "enclose:'" \
    -H "escape:\\" \
    -H "skip_lines:2" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```

[Broker Load](./import-way/broker-load-manual.md)
```sql
LOAD LABEL example_db.example_label_1
(
    DATA INFILE("s3://your_bucket_name/your_file.txt")
    INTO TABLE load_test
    COLUMNS TERMINATED BY "|"
    LINES TERMINATED BY "\n"
    PROPERTIES
    (
        "enclose" = "'",
        "escape" = "\\",
        "skip_lines = "2"
    )
)
WITH S3
(
    "AWS_ENDPOINT" = "AWS_ENDPOINT",
    "AWS_ACCESS_KEY" = "AWS_ACCESS_KEY",
    "AWS_SECRET_KEY"="AWS_SECRET_KEY",
    "AWS_REGION" = "AWS_REGION"
)
```

[Routine Load](./import-way/routine-load-manual.md)
```sql
CREATE ROUTINE LOAD demo.kafka_job01 ON routine_test01
     COLUMNS TERMINATED BY "|",
     COLUMNS(id, name, age)
     PROPERTIES
     (
         "enclose" = "'",
         "escape" = "\\"
     )
     FROM KAFKA
     (
         "kafka_broker_list" = "10.16.10.6:9092",
         "kafka_topic" = "routineLoad01",
         "property.group.id" = "kafka_job01",
         "property.kafka_default_offsets" = "OFFSET_BEGINNING"
     );  
```

[MySQL Load](./import-way/mysql-load-manual.md)
```sql
LOAD DATA LOCAL
INFILE "testData"
INTO TABLE testDb.testTbl
COLUMNS TERMINATED BY "|"
LINES TERMINATED BY "\n"
PROPERTIES
(
    "enclose" = "'",
    "escape" = "\\"
);
```


## Json format
Doris supports importing data in JSON format. This document mainly describes the precautions when importing data in JSON format.

### Supported import methods

Currently, only the following import methods support data import in JSON format:

- [Stream Load](./import-way/stream-load-manual.md)
- [Broker Load](./import-way/broker-load-manual.md)
- [Routine Load](./import-way/routine-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../sql-manual/sql-functions/table-valued-functions/hdfs)

### Supported JSON Formats

Currently only the following three JSON formats are supported:

- Multiple rows of data represented by Array

   JSON format with Array as root node. Each element in the Array represents a row of data to be imported, usually an Object. An example is as follows:

   ```json
   [
       { "id": 123, "city" : "beijing"},
       { "id": 456, "city" : "shanghai"},
       ...
   ]
   ```

   ```json
   [
       { "id": 123, "city" : { "name" : "beijing", "region" : "haidian"}},
       { "id": 456, "city" : { "name" : "beijing", "region" : "chaoyang"}},
       ...
   ]
   ```

   This method is typically used for Stream Load import methods to represent multiple rows of data in a batch of imported data.

   This method must be used with the setting `strip_outer_array=true`. Doris will expand the array when parsing, and then parse each Object in turn as a row of data.

- A single row of data represented by Object
   JSON format with Object as root node. The entire Object represents a row of data to be imported. An example is as follows:

   ```json
   { "id": 123, "city" : "beijing"}
   ```
 
   ```json
   { "id": 123, "city" : { "name" : "beijing", "region" : "haidian" }}
   ```
 
   This method is usually used for the Routine Load import method, such as representing a message in Kafka, that is, a row of data.

- Multiple lines of Object data separated by a fixed delimiter
   
   A row of data represented by Object represents a row of data to be imported. The example is as follows:
 
   ```json
   { "id": 123, "city" : "beijing"}
   { "id": 456, "city" : "shanghai"}
   ...
   ```
 
   This method is typically used for Stream Load import methods to represent multiple rows of data in a batch of imported data.
 
   This method must be used with the setting `read_json_by_line=true`, the special delimiter also needs to specify the `line_delimiter` parameter, the default is `\n`. When Doris parses, it will be separated according to the delimiter, and then parse each line of Object as a line of data.

### Parameter Configuration
- streaming_load_json_max_mb parameters

  Some data formats, such as JSON, cannot be split. Doris must read all the data into the memory before parsing can begin. Therefore, this value is used to limit the maximum amount of data that can be loaded in a single Stream load.
  
  The default value is 100, The unit is MB, modify this parameter by referring to the [BE configuration](../../admin-manual/config/be-config.md).
  
- fuzzy_parse parameters

  In [STREAM LOAD](../../sql-manual/sql-statements/Data-Manipulation-Statements/Load/STREAM-LOAD.md) `fuzzy_parse` parameter can be added to speed up JSON Data import efficiency.
  
  This parameter is usually used to import the format of **multi-line data represented by Array**, so it is generally used with `strip_outer_array=true`.
  
  This feature requires that each row of data in the Array has exactly the same order of fields. Doris will only parse according to the field order of the first row, and then access the subsequent data in the form of subscripts. This method can improve the import efficiency by 3-5X.

### JSON Path

Doris supports extracting data specified in JSON through JSON Path.

**Note: Because for Array type data, Doris will expand the array first, and finally process it in a single line according to the Object format. So the examples later in this document are all explained with Json data in a single Object format. **

- do not specify JSON Path

  If JSON Path is not specified, Doris will use the column name in the table to find the element in Object by default. An example is as follows:

  The table contains two columns: `id`, `city`

  The JSON data is as follows:

  ```json
  { "id": 123, "city" : "beijing"}
  ```

  Then Doris will use `id`, `city` for matching, and get the final data `123` and `beijing`.

  If the JSON data is as follows:

  ```json
  { "id": 123, "name" : "beijing"}
  ```

  Then use `id`, `city` for matching, and get the final data `123` and `null`.

- Specify JSON Path

  Specify a set of JSON Path in the form of a JSON data. Each element in the array represents a column to extract. An example is as follows:

  ```json
  ["$.id", "$.name"]
  ```

  ```json
  ["$.id.sub_id", "$.name[0]", "$.city[0]"]
  ```

  Doris will use the specified JSON Path for data matching and extraction.

- matches non-primitive types

  The values that are finally matched in the preceding examples are all primitive types, such as integers, strings, and so on. Doris currently does not support composite types, such as Array, Map, etc. So when a non-basic type is matched, Doris will convert the type to a string in Json format and import it as a string type. An example is as follows:

  The JSON data is:

  ```json
  { "id": 123, "city" : { "name" : "beijing", "region" : "haidian" }}
  ```

  JSON Path is `["$.city"]`. The matched elements are:

  ```json
  { "name" : "beijing", "region" : "haidian" }
  ```

  The element will be converted to a string for subsequent import operations:

  ```json
  "{'name':'beijing','region':'haidian'}"
  ```

- match failed

  When the match fails, `null` will be returned. An example is as follows:

  The JSON data is:

  ```json
  { "id": 123, "name" : "beijing"}
  ```

  JSON Path is `["$.id", "$.info"]`. The matched elements are `123` and `null`.

  Doris currently does not distinguish between null values represented in JSON data and null values produced when a match fails. Suppose the JSON data is:

  ```json
  { "id": 123, "name" : null }
  ```

  The same result would be obtained with the following two JSON Paths: `123` and `null`.

  ```json
  ["$.id", "$.name"]
  ```

  ```json
  ["$.id", "$.info"]
  ```

- Exact match failed

  In order to prevent misoperation caused by some parameter setting errors. When Doris tries to match a row of data, if all columns fail to match, it considers this to be an error row. Suppose the Json data is:

  ```json
  { "id": 123, "city" : "beijing" }
  ```

  If the JSON Path is written incorrectly as (or if the JSON Path is not specified, the columns in the table do not contain `id` and `city`):

  ```json
  ["$.ad", "$.infa"]
  ```

  would cause the exact match to fail, and the line would be marked as an error line instead of yielding `null, null`.

### JSON Path and Columns

JSON Path is used to specify how to extract data in JSON format, while Columns specifies the mapping and conversion relationship of columns. Both can be used together.

In other words, it is equivalent to rearranging the columns of a JSON format data according to the column order specified in JSON Path through JSON Path. After that, you can map the rearranged source data to the columns of the table through Columns. An example is as follows:

Data content:

```json
{"k1": 1, "k2": 2}
```

Table Structure:

```
k2 int, k1 int
```

Import statement 1 (take Stream Load as an example):

```shell
curl -v --location-trusted -u root: -H "format: json" -H "jsonpaths: [\"$.k2\", \"$.k1\"]" -T example.json http:/ /127.0.0.1:8030/api/db1/tbl1/_stream_load
```

In import statement 1, only JSON Path is specified, and Columns is not specified. The role of JSON Path is to extract the JSON data in the order of the fields in the JSON Path, and then write it in the order of the table structure. The final imported data results are as follows:

```text
+------+------+
| k1   | k2   |
+------+------+
| 2    | 1    |
+------+------+
```

You can see that the actual k1 column imports the value of the "k2" column in the JSON data. This is because the field name in JSON is not equivalent to the field name in the table structure. We need to explicitly specify the mapping between the two.

Import statement 2:

```shell
curl -v --location-trusted -u root: -H "format: json" -H "jsonpaths: [\"$.k2\", \"$.k1\"]" -H "columns: k2, k1 " -T example.json http://127.0.0.1:8030/api/db1/tbl1/_stream_load
```

Compared with the import statement 1, the Columns field is added here to describe the mapping relationship of the columns, in the order of `k2, k1`. That is, after extracting in the order of fields in JSON Path, specify the value of column k2 in the table for the first column, and the value of column k1 in the table for the second column. The final imported data results are as follows:

```text
+------+------+
| k1   |  k2  |
+------+------+
| 1    | 2    |
+------+------+
```

Of course, as with other imports, column transformations can be performed in Columns. An example is as follows:

```shell
curl -v --location-trusted -u root: -H "format: json" -H "jsonpaths: [\"$.k2\", \"$.k1\"]" -H "columns: k2, tmp_k1 , k1 = tmp_k1 * 100" -T example.json http://127.0.0.1:8030/api/db1/tbl1/_stream_load
```

The above example will import the value of k1 multiplied by 100. The final imported data results are as follows:

```text
+------+------+
| k1   | k2   |
+------+------+
| 100  | 2    |
+------+------+
```

Import statement 3:

Compared with the  import statement 1 and import statement 2, the columns field `k1_copy` is added here.
Table Structure:

```text
k2 int, k1 int, k1_copy int
```

If you want to assign a column field in JSON to several column fields in the table multiple times, you can specify the column multiple times in jsonPaths and specify the mapping order in sequence. An example is as follows:

```shell
curl -v --location-trusted -u root: -H "format: json" -H "jsonpaths: [\"$.k2\", \"$.k1\", \"$.k1\"]" -H "columns: k2,k1,k1_copy" -T example.json http://127.0.0.1:8030/api/db1/tbl1/_stream_load
```

The above example will extract the fields in the order specified by the JSON Path. It designates the first column as the value for the `k2` column in the table, the second column as the value for the `k1` column, and the third column as the value for the `k1_copy` column. The final imported data result is as follows:

```text
+------+------+---------+
| k2   | k1   | k2_copy |
+------+------+---------+
|    2 |    1 |       2 |
+------+------+---------+
```

Import statement 4:

Data content:

```json
{"k1" : 1, "k2": 2, "k3": {"k1" : 31, "k1_nested" : {"k1" : 32} } }
```

Compared with the  import statement 1 and import statement 2, the columns field `k1_nested1` and `k1_nested2` are added here.

Table Structure:

```text
k2 int, k1 int, k1_nested1 int, k1_nested2 int
```
If you want to assign multi-level fields with the same name nested in json to different columns in the table, you can specify the column in jsonPaths and specify the mapping order in turn. An example are as follows:

```shell
curl -v --location-trusted -u root: -H "format: json" -H "jsonpaths: [\"$.k2\", \"$.k1\",\"$.k3.k1\",\"$.k3.k1_nested.k1\"]" -H "columns: k2,k1,k1_nested1,k1_nested2" -T example.json http://127.0.0.1:8030/api/db1/tbl1/_stream_load
```

The above example will extract the fields in the order of the JSON Path, specifying that the first column is the value of the `k2` column in the table, the second column is the value of the `k1` column in the table, and the third column is the `k1` column in the nested type. The value of the `k1_nested1` column, from which we know that the `k3.k1_nested.k1` column is the value of the `k1_nested2` column in the table. The final imported data results are as follows:

```text
+------+------+------------+------------+
| k2   | k1   | k1_nested1 | k1_nested2 |
+------+------+------------+------------+
|    2 |    1 |         31 |         32 |
+------+------+------------+------------+
```

### JSON root

Doris supports extracting data specified in JSON through JSON root.

**Note: Because for Array type data, Doris will expand the array first, and finally process it in a single line according to the Object format. So the examples later in this document are all explained with Json data in a single Object format. **

- do not specify JSON root

  If JSON root is not specified, Doris will use the column name in the table to find the element in Object by default. An example is as follows:

  The table contains two columns: `id`, `city`

  The JSON data is as follows:

  ```json
  { "id": 123, "name" : { "id" : "321", "city" : "shanghai" }}
  ```

  Then use `id`, `city` for matching, and get the final data `123` and `null`

- Specify JSON root

  When the import data format is JSON, you can specify the root node of the JSON data through json_root. Doris will extract the elements of the root node through json_root for parsing. Default is empty.

  Specify JSON root `-H "json_root: $.name"`. The matched elements are:

  ```json
  { "id" : "321", "city" : "shanghai" }
  ```

  The element will be treated as new JSON for subsequent import operations,and get the final data 321 and shanghai

### NULL and Default values

Example data is as follows:

```json
[
    {"k1": 1, "k2": "a"},
    {"k1": 2},
    {"k1": 3, "k2": "c"}
]
```


The table structure is: `k1 int null, k2 varchar(32) null default "x"`

The import statement is as follows:

```shell
curl -v --location-trusted -u root: -H "format: json" -H "strip_outer_array: true" -T example.json http://127.0.0.1:8030/api/db1/tbl1/_stream_load
```

The import results that users may expect are as follows, that is, for missing columns, fill in the default values.

```text
+------+------+
| k1 | k2     |
+------+------+
| 1    | a    |
+------+------+
| 2    | x    |
+------+------+
|3     |c     |
+------+------+
```

But the actual import result is as follows, that is, for the missing column, NULL is added.

```text
+------+------+
| k1 | k2     |
+------+------+
| 1    | a    |
+------+------+
| 2    | NULL |
+------+------+
|3     |c     |
+------+------+
```

This is because Doris doesn't know "the missing column is column k2 in the table" from the information in the import statement. If you want to import the above data according to the expected result, the import statement is as follows:

```shell
curl -v --location-trusted -u root: -H "format: json" -H "strip_outer_array: true" -H "jsonpaths: [\"$.k1\", \"$.k2\"]" - H "columns: k1, tmp_k2, k2 = ifnull(tmp_k2, 'x')" -T example.json http://127.0.0.1:8030/api/db1/tbl1/_stream_load
```

### Application example

#### Stream Load

Because of the inseparability of the JSON format, when using Stream Load to import a JSON format file, the file content will be fully loaded into the memory before processing begins. Therefore, if the file is too large, it may take up more memory.

Suppose the table structure is:

```text
id INT NOT NULL,
city VARCHAR NULL,
code INT NULL
```

1. Import a single row of data 1

```json
{"id": 100, "city": "beijing", "code" : 1}
```

- do not specify JSON Path

```shell
curl --location-trusted -u user:passwd -H "format: json" -T data.json http://localhost:8030/api/db1/tbl1/_stream_load
```

Import result:

```text
100 beijing 1
```

- Specify JSON Path

```shell
curl --location-trusted -u user:passwd -H "format: json" -H "jsonpaths: [\"$.id\",\"$.city\",\"$.code\"]" - T data.json http://localhost:8030/api/db1/tbl1/_stream_load
```

Import result:

```text
100 beijing 1
```

2. Import a single row of data 2

 ```json
{"id": 100, "content": {"city": "beijing", "code": 1}}
```

- Specify JSON Path

```shell
curl --location-trusted -u user:passwd -H "format: json" -H "jsonpaths: [\"$.id\",\"$.content.city\",\"$.content.code\ "]" -T data.json http://localhost:8030/api/db1/tbl1/_stream_load
```

Import result:

```text
100 beijing 1
```

3. Import multiple rows of data as Array

```json
[
    {"id": 100, "city": "beijing", "code" : 1},
    {"id": 101, "city": "shanghai"},
    {"id": 102, "city": "tianjin", "code" : 3},
    {"id": 103, "city": "chongqing", "code" : 4},
    {"id": 104, "city": ["zhejiang", "guangzhou"], "code" : 5},
    {
        "id": 105,
        "city": {
            "order1": ["guangzhou"]
        },
        "code" : 6
    }
]
```

- Specify JSON Path

```shell
curl --location-trusted -u user:passwd -H "format: json" -H "jsonpaths: [\"$.id\",\"$.city\",\"$.code\"]" - H "strip_outer_array: true" -T data.json http://localhost:8030/api/db1/tbl1/_stream_load
```

Import result:

```text
100 beijing 1
101 shanghai NULL
102 tianjin 3
103 chongqing 4
104 ["zhejiang","guangzhou"] 5
105 {"order1":["guangzhou"]} 6
```

4. Import multi-line data as multi-line Object

```json
{"id": 100, "city": "beijing", "code" : 1}
{"id": 101, "city": "shanghai"}
{"id": 102, "city": "tianjin", "code" : 3}
{"id": 103, "city": "chongqing", "code" : 4}
```

StreamLoad import:

```shell
curl --location-trusted -u user:passwd -H "format: json" -H "read_json_by_line: true" -T data.json http://localhost:8030/api/db1/tbl1/_stream_load
```
Import result:
	
```shell
100     beijing                     1
101     shanghai                    NULL
102     tianjin                     3
103     chongqing                   4
```

5. Transform the imported data

The data is still the multi-line data in Example 3, and now it is necessary to add 1 to the `code` column in the imported data before importing.

```shell
curl --location-trusted -u user:passwd -H "format: json" -H "jsonpaths: [\"$.id\",\"$.city\",\"$.code\"]" - H "strip_outer_array: true" -H "columns: id, city, tmpc, code=tmpc+1" -T data.json http://localhost:8030/api/db1/tbl1/_stream_load
```

Import result:

```text
100 beijing 2
101 shanghai NULL
102 tianjin 4
103 chongqing 5
104 ["zhejiang","guangzhou"] 6
105 {"order1":["guangzhou"]} 7
```

6. Import Array by JSON
Since the Rapidjson handles decimal and largeint numbers which will cause precision problems, 
we suggest you to use JSON string to import data to `array<decimal>` or `array<largeint>` column.

```json
{"k1": 39, "k2": ["-818.2173181"]}
```

```json
{"k1": 40, "k2": ["10000000000000000000.1111111222222222"]}
```

```shell
curl --location-trusted -u root:  -H "max_filter_ratio:0.01" -H "format:json" -H "timeout:300" -T test_decimal.json http://localhost:8030/api/example_db/array_test_decimal/_stream_load
```

Import result:
```shell
MySQL > select * from array_test_decimal;
+------+----------------------------------+
| k1   | k2                               |
+------+----------------------------------+
|   39 | [-818.2173181]                   |
|   40 | [100000000000000000.001111111]   |
+------+----------------------------------+
```


```json
{"k1": 999, "k2": ["76959836937749932879763573681792701709", "26017042825937891692910431521038521227"]}
```

```shell
curl --location-trusted -u root:  -H "max_filter_ratio:0.01" -H "format:json" -H "timeout:300" -T test_largeint.json http://localhost:8030/api/example_db/array_test_largeint/_stream_load
```

Import result:
```shell
MySQL > select * from array_test_largeint;
+------+------------------------------------------------------------------------------------+
| k1   | k2                                                                                 |
+------+------------------------------------------------------------------------------------+
|  999 | [76959836937749932879763573681792701709, 26017042825937891692910431521038521227]   |
+------+------------------------------------------------------------------------------------+
```

#### Routine Load

The processing principle of Routine Load for JSON data is the same as that of Stream Load. It is not repeated here.

For Kafka data sources, the content in each Massage is treated as a complete JSON data. If there are multiple rows of data represented in Array format in a Massage, multiple rows will be imported, and the offset of Kafka will only increase by 1. If an Array format Json represents multiple lines of data, but the Json parsing fails due to the wrong Json format, the error line will only increase by 1 (because the parsing fails, in fact, Doris cannot determine how many lines of data are contained in it, and can only error by one line data record)

## Parquet
### Supported Import Methods
The following import methods support importing data in CSV format:
- [Stream Load](./import-way/stream-load-manual.md)
- [Broker Load](./import-way/broker-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../sql-manual/sql-functions/table-valued-functions/hdfs)

### Import Examples

[Stream Load](./import-way/stream-load-manual.md) 

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "format:parquet" \
    -T streamload_example.parquet \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```

[Broker Load](./import-way/broker-load-manual.md)
```sql
LOAD LABEL example_db.example_label_1
(
    DATA INFILE("s3://your_bucket_name/your_file.parquet")
    INTO TABLE load_test
    FORMAT AS "parquet"
)
WITH S3
(
    "AWS_ENDPOINT" = "AWS_ENDPOINT",
    "AWS_ACCESS_KEY" = "AWS_ACCESS_KEY",
    "AWS_SECRET_KEY"="AWS_SECRET_KEY",
    "AWS_REGION" = "AWS_REGION"
);
```

## ORC
### Supported Import Methods
The following import methods support importing data in CSV format:
- [Stream Load](./import-way/stream-load-manual.md)
- [Broker Load](./import-way/broker-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../sql-manual/sql-functions/table-valued-functions/hdfs)

### Import Examples

[Stream Load](./import-way/stream-load-manual.md) 

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "format:orc" \
    -T streamload_example.orc \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```

[Broker Load](./import-way/broker-load-manual.md)
```sql
LOAD LABEL example_db.example_label_1
(
    DATA INFILE("s3://your_bucket_name/your_file.orc")
    INTO TABLE load_test
    FORMAT AS "orc"
)
WITH S3
(
    "AWS_ENDPOINT" = "AWS_ENDPOINT",
    "AWS_ACCESS_KEY" = "AWS_ACCESS_KEY",
    "AWS_SECRET_KEY"="AWS_SECRET_KEY",
    "AWS_REGION" = "AWS_REGION"
);
```
