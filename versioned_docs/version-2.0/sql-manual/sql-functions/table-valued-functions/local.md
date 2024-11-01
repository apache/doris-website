---
{
    "title": "LOCAL",
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

## local

### Name

local

### Description

Local table-valued-function(tvf), allows users to read and access local file contents on be node, just like accessing relational table. Currently supports `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` file format.

It needs `ADMIN` privilege to use.

#### syntax

```sql
local(
  "file_path" = "path/to/file.txt", 
  "backend_id" = "be_id",
  "format" = "csv",
  "keyn" = "valuen" 
  ...
  );
```

**parameter description**

- Related parameters for accessing local file on be node:

    - `file_path`:
    
        (required) The path of the file to be read, which is a relative path to the `user_files_secure_path` directory, where `user_files_secure_path` parameter [can be configured on be](../../../admin-manual/config/be-config.md).
    
        Can not contains `..` in path. Support using glob syntax to match multi files, such as `log/*.log`

- Related to execution method:

    In versions prior to 2.1.1, Doris only supported specifying a BE node to read local data files on that node.

    - `backend_id`:

        The be id where the file is located. `backend_id` can be obtained through the `show backends` command.

    Starting from version 2.1.2, Doris adds a new parameter `shared_storage`.

    - `shared_storage`

        Default is false. If true, the specified file exists on shared storage (such as NAS). Shared storage must be compatible with the POXIS file interface and mounted on all BE nodes at the same time.

        When `shared_storage` is true, you do not need to set `backend_id`, Doris may use all BE nodes for data access. If `backend_id` is set, still only executes on the specified BE node.

- File format parameters:

    - `format`: (required) Currently support `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`
    - `column_separator`: (optional) default `,`.
    - `line_delimiter`: (optional) default `\n`.
    - `compress_type`: (optional) Currently support `UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK`. Default value is `UNKNOWN`, it will automatically infer the type based on the suffix of `uri`.

- The following parameters are used for loading in json format. For specific usage methods, please refer to: [Json Load](../../../data-operate/import/import-way/load-json-format.md)

    - `read_json_by_line`: (optional) default `"true"`
    - `strip_outer_array`: (optional) default `"false"`
    - `json_root`: (optional) default `""`
    - `json_paths`: (optional) default `""`
    - `num_as_string`: (optional) default `false`
    - `fuzzy_parse`: (optional) default `false`

- The following parameters are used for loading in csv format

    - `trim_double_quotes`: Boolean type (optional), the default value is `false`. True means that the outermost double quotes of each field in the csv file are trimmed.
    - `skip_lines`: Integer type (optional), the default value is 0. It will skip some lines in the head of csv file. It will be disabled when the format is `csv_with_names` or `csv_with_names_and_types`.

- other parameter:

    - `path_partition_keys`: (optional) Specifies the column names carried in the file path. For example, if the file path is /path/to/city=beijing/date="2023-07-09", you should fill in `path_partition_keys="city,date"`. It will automatically read the corresponding column names and values from the path during load process.


### Examples

Analyze the log file on specified BE:

```sql
mysql> select * from local(
        "file_path" = "log/be.out",
        "backend_id" = "10006",
        "format" = "csv")
       where c1 like "%start_time%" limit 10;
+--------------------------------------------------------+
| c1                                                     |
+--------------------------------------------------------+
| start time: 2023年 08月 07日 星期一 23:20:32 CST       |
| start time: 2023年 08月 07日 星期一 23:32:10 CST       |
| start time: 2023年 08月 08日 星期二 00:20:50 CST       |
| start time: 2023年 08月 08日 星期二 00:29:15 CST       |
+--------------------------------------------------------+
```

Read and access csv format files located at path `${DORIS_HOME}/student.csv`:

```sql
mysql> select * from local(
      "file_path" = "student.csv", 
      "backend_id" = "10003", 
      "format" = "csv");
+------+---------+--------+
| c1   | c2      | c3     |
+------+---------+--------+
| 1    | alice   | 18     |
| 2    | bob     | 20     |
| 3    | jack    | 24     |
| 4    | jackson | 19     |
| 5    | liming  | d18    |
+------+---------+--------+
```

Query files on NAS:

```sql
mysql> select * from local(
        "file_path" = "/mnt/doris/prefix_*.txt",
        "format" = "csv",
        "column_separator" =",",
        "shared_storage" = "true");
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
| 1    | 2    | 3    |
| 1    | 2    | 3    |
| 1    | 2    | 3    |
| 1    | 2    | 3    |
| 1    | 2    | 3    |
+------+------+------+
```

Can be used with `desc function` :

```sql
mysql> desc function local(
      "file_path" = "student.csv", 
      "backend_id" = "10003", 
      "format" = "csv");
+-------+------+------+-------+---------+-------+
| Field | Type | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| c1    | TEXT | Yes  | false | NULL    | NONE  |
| c2    | TEXT | Yes  | false | NULL    | NONE  |
| c3    | TEXT | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+
```

### Keywords

local, table-valued-function, tvf

### Best Practice

- For more detailed usage of local tvf, please refer to [S3](./s3.md) tvf, The only difference between them is the way of accessing the storage system.

- Access data on NAS through local tvf

     NAS shared storage allows to be mounted to multiple nodes at the same time. Each node can access files in the shared storage just like local files. Therefore, the NAS can be thought of as a local file system, accessed through local tvf.

     When setting `"shared_storage" = "true"`, Doris will think that the specified file can be accessed from any BE node. When a set of files is specified using wildcards, Doris will distribute requests to access files to multiple BE nodes, so that multiple nodes can be used to perform distributed file scanning and improve query performance.
