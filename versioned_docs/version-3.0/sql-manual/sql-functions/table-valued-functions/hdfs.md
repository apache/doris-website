---
{
  "title": "HDFS",
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

## Description

HDFS table-valued-function(tvf), allows users to read and access file contents on S3-compatible object storage, just like accessing relational table. Currently supports `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` file format.

## Syntax

```sql
HDFS(
    "uri" = "<uri>",
    "fs.defaultFS" = "<fs_defaultFS>",
    "hadoop.username" = "<hadoop_username>",
    "format" = "<format>",
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  );
```

## Required Parameters
| Parameter              | Description                                                                                                            |
|------------------------|------------------------------------------------------------------------------------------------------------------------|
| `uri`                  | The URI for accessing HDFS. If the URI path does not exist or the file is empty, the HDFS TVF will return an empty set. |
| `fs.defaultFS`         | The default file system URI for HDFS                                                                                    |
| `hadoop.username`      | Required, can be any string but cannot be empty.                                                                        |
| `format`               | File format, required. Currently supports `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc/avro`.           |

## Optional Parameters

`optional_property_key` in the above syntax can select the corresponding parameter from the following list as needed, and `optional_property_value` is the value of the parameter

| Parameter                                   | Description                                                                                                                                  | Remarks                                                                             |
|---------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| `hadoop.security.authentication`            | HDFS security authentication type                                                                                                            |                                                                                     |
| `hadoop.username`                           | Alternative HDFS username                                                                                                                    |                                                                                     |
| `hadoop.kerberos.principal`                 | Kerberos principal                                                                                                                           |                                                                                     |
| `hadoop.kerberos.keytab`                    | Kerberos keytab                                                                                                                                 |                                                                                     |
| `dfs.client.read.shortcircuit`              | Enable short-circuit read                                                                                                                    |                                                                                     |
| `dfs.domain.socket.path`                   | Domain socket path                                                                                                                           |                                                                                     |
| `dfs.nameservices`                          | The nameservice for HA mode                                                                                                                  |                                                                                     |
| `dfs.ha.namenodes.your-nameservices`        | Configuration for namenode in HA mode                                                                                                        |                                                                                     |
| `dfs.namenode.rpc-address.your-nameservices.your-namenode` | Specify the RPC address for the namenode                                                                                                     |                                                                                     |
| `dfs.client.failover.proxy.provider.your-nameservices` | Specify the proxy provider for failover                                                                                                      |                                                                                     |
| `column_separator`                          | Column separator, default is `\t`                                                                                                            |                                                                                     |
| `line_delimiter`                            | Line separator, default is `\n`                                                                                                              |                                                                                     |
| `compress_type`                             | Supported types: `UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK`. Default is `UNKNOWN`, and the type will be automatically inferred based on the URI suffix. |                                                                                     |
| `read_json_by_line`                         | For JSON format imports, default is `true`                                                                                                   | Reference: [JSON Load](../../../data-operate/import/file-format/json) |
| `strip_outer_array`                         | For JSON format imports, default is `false`                                                                                                  | Reference: [JSON Load](../../../data-operate/import/file-format/json) |
| `json_root`                                 | For JSON format imports, default is empty                                                                                                   | Reference: [JSON Load](../../../data-operate/import/file-format/json) |
| `json_paths`                                | For JSON format imports, default is empty                                                                                                   | Reference: [JSON Load](../../../data-operate/import/file-format/json) |
| `num_as_string`                             | For JSON format imports, default is `false`                                                                                                 | Reference: [JSON Load](../../../data-operate/import/file-format/json) |
| `fuzzy_parse`                               | For JSON format imports, default is `false`                                                                                                 | Reference: [JSON Load](../../../data-operate/import/file-format/json) |
| `trim_double_quotes`                        | For CSV format imports, boolean type. Default is `false`. If `true`, removes the outermost double quotes from each field.                  |                                                                                     |
| `skip_lines`                                | For CSV format imports, integer type. Default is 0. Skips the first few lines of the CSV file. This parameter is ignored if `csv_with_names` or `csv_with_names_and_types` is set. |                                                                                     |
| `path_partition_keys`                       | Specify the partition column names carried in the file path, for example `/path/to/city=beijing/date="2023-07-09"`, then fill in `path_partition_keys="city,date"`, which will automatically read the corresponding column names and values from the path for import. |                                                                                     |
| `resource`                                  | Specify the resource name. HDFS TVF can directly access HDFS using an existing HDFS resource. Refer to [CREATE-RESOURCE](../../sql-statements/cluster-management/compute-management/CREATE-RESOURCE) for creating HDFS resources. | Supported from version 2.1.4 and above.                                            |

## Access Control Requirements

| Privilege     | Object | Notes |
|:--------------|:-------|:------|
| USAGE_PRIV    | table  |       |
| SELECT_PRIV   | table  |       |


## Examples

- Read and access csv format files on hdfs storage.
  ```sql
  select * from hdfs(
                "uri" = "hdfs://127.0.0.1:842/user/doris/csv_format_test/student.csv",
                "fs.defaultFS" = "hdfs://127.0.0.1:8424",
                "hadoop.username" = "doris",
                "format" = "csv");
  ```
  ```text
    +------+---------+------+
    | c1   | c2      | c3   |
    +------+---------+------+
    | 1    | alice   | 18   |
    | 2    | bob     | 20   |
    | 3    | jack    | 24   |
    | 4    | jackson | 19   |
    | 5    | liming  | 18   |
    +------+---------+------+
  ```

- Read and access csv format files on hdfs storage in HA mode.

  ```sql
  select * from hdfs(
              "uri" = "hdfs://127.0.0.1:842/user/doris/csv_format_test/student.csv",
              "fs.defaultFS" = "hdfs://127.0.0.1:8424",
              "hadoop.username" = "doris",
              "format" = "csv",
              "dfs.nameservices" = "my_hdfs",
              "dfs.ha.namenodes.my_hdfs" = "nn1,nn2",
              "dfs.namenode.rpc-address.my_hdfs.nn1" = "nanmenode01:8020",
              "dfs.namenode.rpc-address.my_hdfs.nn2" = "nanmenode02:8020",
              "dfs.client.failover.proxy.provider.my_hdfs" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider");
  ```
  ```text
    +------+---------+------+
    | c1   | c2      | c3   |
    +------+---------+------+
    | 1    | alice   | 18   |
    | 2    | bob     | 20   |
    | 3    | jack    | 24   |
    | 4    | jackson | 19   |
    | 5    | liming  | 18   |
    +------+---------+------+
  ```

- Can be used with `desc function` :

  ```sql
  desc function hdfs(
              "uri" = "hdfs://127.0.0.1:8424/user/doris/csv_format_test/student_with_names.csv",
              "fs.defaultFS" = "hdfs://127.0.0.1:8424",
              "hadoop.username" = "doris",
              "format" = "csv_with_names");
  ```
