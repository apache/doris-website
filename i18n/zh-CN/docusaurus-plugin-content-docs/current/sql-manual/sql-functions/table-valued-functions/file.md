---
{
    "title": "FILE",
    "language": "zh-CN"
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

## 描述

File 表函数（table-valued-function,tvf）是对 S3、HDFS 和 LOCAL TVF 的封装，提供了一个统一的接口来访问不同存储系统上的文件内容。目前支持`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc/avro`文件格式。

## 语法

```sql
FILE(
    "storage_type" = "<storage_type>",
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
)
```

## 必填参数
| 参数 | 说明 |
| -- | -- |
| `storage_type` | 存储类型，必填，目前支持 `s3/hdfs/local` |

## 可选参数

根据不同的 `storage_type`，需要提供相应的参数：

### S3 存储类型参数

当 `storage_type = "s3"` 时，需要提供以下参数：

| 参数 | 说明 |
| -- | -- |
| `uri` | 访问 S3 的 URI |
| `s3.access_key` | S3 的访问密钥 |
| `s3.secret_key` | S3 的密钥 |
| `s3.region` | S3 存储所在的区域 |
| `s3.endpoint` | S3 存储的终端节点地址 |
| `format` | 文件格式，支持 `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc/avro` |

更多 S3 相关参数请参考 [S3 TVF](./s3.md)。

### HDFS 存储类型参数

当 `storage_type = "hdfs"` 时，需要提供以下参数：

| 参数 | 说明 |
| -- | -- |
| `uri` | 访问 HDFS 的 URI |
| `fs.defaultFS` | HDFS 的默认文件系统 URI |
| `hadoop.username` | HDFS 用户名 |
| `format` | 文件格式，支持 `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc/avro` |

更多 HDFS 相关参数请参考 [HDFS TVF](./hdfs.md)。

### LOCAL 存储类型参数

当 `storage_type = "local"` 时，需要提供以下参数：

| 参数 | 说明 |
| -- | -- |
| `file_path` | 待读取文件的路径 |
| `backend_id` | 文件所在的 BE 节点 ID |
| `format` | 文件格式，支持 `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc/avro` |

更多 LOCAL 相关参数请参考 [LOCAL TVF](./local.md)。

## 通用可选参数

以下参数对所有存储类型都适用：

| 参数 | 说明 | 
| -- | -- |
| `column_separator` | 列分隔符，默认为 `\t` |
| `line_delimiter` | 行分隔符，默认为 `\n` |
| `compress_type` | 压缩类型，支持 `UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK` |
| `read_json_by_line` | 对 JSON 格式导入，默认为 `true` |
| `strip_outer_array` | 对 JSON 格式导入，默认为 `false` |
| `json_root` | 对 JSON 格式导入，默认为空 |
| `json_paths` | 对 JSON 格式导入，默认为空 |
| `num_as_string` | 对 JSON 格式导入，默认为 `false` |
| `fuzzy_parse` | 对 JSON 格式导入，默认为 `false` |
| `trim_double_quotes` | 对 CSV 格式导入，默认为 `false`，为 `true` 时裁剪每个字段的外层双引号 |
| `skip_lines` | 对 CSV 格式导入，默认为 0，表示跳过 CSV 文件前几行 |
| `path_partition_keys` | 指定文件路径中携带的分区列名 |

## 示例

### 访问 S3 存储

```sql
select * from file(
    "storage_type" = "s3",
    "uri" = "s3://bucket/file.csv",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "endpoint",
    "s3.region" = "region",
    "format" = "csv"
);
```

### 访问 HDFS 存储

```sql
select * from file(
    "storage_type" = "hdfs",
    "uri" = "hdfs://path/to/file.csv",
    "fs.defaultFS" = "hdfs://localhost:9000",
    "hadoop.username" = "doris",
    "format" = "csv"
);
```

### 访问本地存储

```sql
select * from file(
    "storage_type" = "local",
    "file_path" = "student.csv",
    "backend_id" = "10003",
    "format" = "csv"
);
```

### 使用 desc function 查看表结构

```sql
desc function file(
    "storage_type" = "s3",
    "uri" = "s3://bucket/file.csv",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "endpoint",
    "s3.region" = "region",
    "format" = "csv"
);
``` 