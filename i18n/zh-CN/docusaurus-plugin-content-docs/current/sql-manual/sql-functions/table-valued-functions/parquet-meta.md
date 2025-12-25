---
{
  "title": "PARQUET_META",
  "language": "zh-CN"
}
---

## 描述

parquet_meta 表函数（table-valued-function,tvf），可以用于读取 Parquet 文件的 footer 元数据，不会扫描数据页。它可以快速查看 Row Group 统计、Schema、文件级元数据、KV 元数据，以及 Bloom Filter 探测结果。

## 语法
```sql
PARQUET_META(
    "uri" = "<uri>",
    "file_path" = "<file_path>",
    "mode" = "<mode>",
    "column" = "<column>",
    "value" = "<value>",
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  );
```

## 必填参数
parquet_meta 表函数 tvf 中的每一个参数都是一个 `"key"="value"` 对

| Field         | Description                                                                 |
|---------------|-----------------------------------------------------------------------------|
| `<uri>`       | 远端路径，必须包含 scheme，例如 `s3://`、`hdfs://`、`oss://`、`cos://`、`obs://`、`gcs://`、`minio://`、`azure://` 等。与 `<file_path>` 二选一。 |
| `<file_path>` | 本地路径，不允许包含 scheme。与 `<uri>` 二选一。                              |

## 可选参数

| Field                     | Description                                                                 |
|--------------------------|-----------------------------------------------------------------------------|
| `<mode>`                 | 可选，默认 `parquet_metadata`。取值见“支持的模式”。                            |
| `<column>`               | 仅 `parquet_bloom_probe` 必填，表示要探测的列名。                              |
| `<value>`                | 仅 `parquet_bloom_probe` 必填，表示要探测的字面值。                            |
| `<optional_property_key>`| 存储参数，按存储类型提供，如 S3/OSS/OBS/COS/GCS/MinIO/Azure 使用 `s3.access_key`、`s3.secret_key`、`endpoint`、`region` 等；HDFS 使用 `hadoop.username` 等。 |

## 支持的模式

- `parquet_metadata`（默认）
- `parquet_schema`
- `parquet_file_metadata`
- `parquet_kv_metadata`
- `parquet_bloom_probe`

## 输出列

### mode = parquet_metadata（默认）

| 字段名 | 类型 |
| --- | --- |
| file_name | STRING |
| row_group_id | BIGINT |
| row_group_num_rows | BIGINT |
| row_group_num_columns | BIGINT |
| row_group_bytes | BIGINT |
| column_id | BIGINT |
| file_offset | BIGINT |
| num_values | BIGINT |
| path_in_schema | STRING |
| type | STRING |
| stats_min | STRING |
| stats_max | STRING |
| stats_null_count | BIGINT |
| stats_distinct_count | BIGINT |
| stats_min_value | STRING |
| stats_max_value | STRING |
| compression | STRING |
| encodings | STRING |
| index_page_offset | BIGINT |
| dictionary_page_offset | BIGINT |
| data_page_offset | BIGINT |
| total_compressed_size | BIGINT |
| total_uncompressed_size | BIGINT |
| key_value_metadata | `MAP<VARBINARY, VARBINARY>` |
| bloom_filter_offset | BIGINT |
| bloom_filter_length | BIGINT |
| min_is_exact | BOOLEAN |
| max_is_exact | BOOLEAN |
| row_group_compressed_bytes | BIGINT |

### mode = parquet_schema

| 字段名 | 类型 |
| --- | --- |
| file_name | VARCHAR |
| name | VARCHAR |
| type | VARCHAR |
| type_length | BIGINT |
| repetition_type | VARCHAR |
| num_children | BIGINT |
| converted_type | VARCHAR |
| scale | BIGINT |
| precision | BIGINT |
| field_id | BIGINT |
| logical_type | VARCHAR |

### mode = parquet_file_metadata

| 字段名 | 类型 |
| --- | --- |
| file_name | STRING |
| created_by | STRING |
| num_rows | BIGINT |
| num_row_groups | BIGINT |
| format_version | BIGINT |
| encryption_algorithm | STRING |
| footer_signing_key_metadata | STRING |

### mode = parquet_kv_metadata

| 字段名 | 类型 |
| --- | --- |
| file_name | STRING |
| key | STRING |
| value | STRING |

### mode = parquet_bloom_probe

| 字段名 | 类型 |
| --- | --- |
| file_name | STRING |
| row_group_id | INT |
| bloom_filter_excludes | INT |

`bloom_filter_excludes` 的含义：
- `1`：Bloom Filter 判断该 Row Group 一定不包含该值
- `0`：Bloom Filter 判断可能包含该值
- `-1`：文件没有 Bloom Filter

## 示例（Examples）

- 本地文件（不带 scheme）。

    ```sql
    SELECT * FROM parquet_meta(
      "file_path" = "/path/to/test.parquet"
    );
    ```

- S3 文件（带 scheme + 存储参数）。

    ```sql
    SELECT * FROM parquet_meta(
      "uri" = "s3://bucket/path/test.parquet",
      "s3.access_key" = "...",
      "s3.secret_key" = "...",
      "endpoint" = "s3.xxx.com",
      "region" = "us-east-1",
      "mode" = "parquet_schema"
    );
    ```

- HDFS 文件。

    ```sql
    SELECT * FROM parquet_meta(
      "uri" = "hdfs://127.0.0.1:8020/path/test.parquet",
      "hadoop.username" = "doris",
      "mode" = "parquet_file_metadata"
    );
    ```

- 通配符（glob）。

    ```sql
    SELECT file_name FROM parquet_meta(
      "uri" = "s3://bucket/path/*meta.parquet",
      "mode" = "parquet_file_metadata"
    );
    ```

## 说明与限制

- `parquet_meta` 只读取 Parquet footer 元数据，不读取数据页，适合快速查看元信息。
- `uri` 与 `file_path` 只能二选一；`uri` 必须有 scheme，`file_path` 不能有 scheme。
- 支持通配符（如 `*`、`{}`、`[]`），若无匹配文件会报错。
