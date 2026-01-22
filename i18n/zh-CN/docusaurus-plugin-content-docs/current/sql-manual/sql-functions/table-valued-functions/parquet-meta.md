---
{
  "title": "PARQUET_META",
  "language": "zh-CN",
  "description": "parquet_meta 表函数（table-valued-function，tvf）可以用于读取 Parquet 文件的 Footer 元数据，不会扫描数据页。它可以快速查看 Row Group 统计、Schema、文件级元数据、KV 元数据以及 Bloom Filter 探测结果。"
}
---

`parquet_meta` 表函数（table-valued-function，tvf）可以用于读取 Parquet 文件的 Footer 元数据，不会扫描数据页。它可以快速查看 Row Group 统计、Schema、文件级元数据、KV 元数据以及 Bloom Filter 探测结果。

> 该功能为实验功能，自 4.1.0 版本支持。

## 语法

```sql
PARQUET_META(
    "uri" = "<uri>",
    "mode" = "<mode>",
    {OptionalParameters},
    {ConnectionParameters}
  );
```

- `uri`

  文件路径。

- `mode`

  元数据查询模式。可选，默认为 `parquet_metadata`。取值见"支持的模式"章节。

- `{OptionalParameters}`

  - `column`：当模式为 `parquet_bloom_probe` 时必填，表示要探测的列名。
  - `value`：当模式为 `parquet_bloom_probe` 时必填，表示要探测的字面值。

- `{ConnectionParameters}`

  访问文件所在的存储系统所需的参数，具体可参阅：

  * [HDFS](../../../lakehouse/storages/hdfs.md)
  * [AWS S3](../../../lakehouse/storages/s3.md)
  * [Google Cloud Storage](../../../lakehouse/storages/gcs.md)
  * [Azure Blob](../../../lakehouse/storages/azure-blob.md)
  * [阿里云 OSS](../../../lakehouse/storages/aliyun-oss.md)
  * [腾讯云 COS](../../../lakehouse/storages/tencent-cos.md)
  * [华为云 OBS](../../../lakehouse/storages/huawei-obs.md)
  * [MinIO](../../../lakehouse/storages/minio.md)

## 支持的模式

### `parquet_metadata`

默认模式。

该模式可用于查询 Parquet 文件中包含的元数据。这些元数据会揭示 Parquet 文件的各种内部细节，例如不同列的统计信息。这有助于确定 Parquet 文件中可以进行何种类型的跳过操作，甚至可以快速了解不同列包含的内容。

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

### `parquet_schema`

该模式可用于查询 Parquet 文件中包含的内部架构。请注意，这是 Parquet 文件元数据中包含的结构。

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

### `parquet_file_metadata`

该模式可用于查询文件级元数据，例如所使用的格式版本和加密算法。

| 字段名 | 类型 |
| --- | --- |
| file_name | STRING |
| created_by | STRING |
| num_rows | BIGINT |
| num_row_groups | BIGINT |
| format_version | BIGINT |
| encryption_algorithm | STRING |
| footer_signing_key_metadata | STRING |

### `parquet_kv_metadata`

该模式可用于查询定义为键值对的自定义元数据。

| 字段名 | 类型 |
| --- | --- |
| file_name | STRING |
| key | STRING |
| value | STRING |

### `parquet_bloom_probe`

Doris 支持使用 Parquet 文件中的布隆过滤器进行数据过滤和裁剪。该模式用于检测指定列和列值是否可以通过布隆过滤器检测。

| 字段名 | 类型 |
| --- | --- |
| file_name | STRING |
| row_group_id | INT |
| bloom_filter_excludes | INT |

`bloom_filter_excludes` 的含义：

- `1`：Bloom Filter 判断该 Row Group 一定不包含该值
- `0`：Bloom Filter 判断可能包含该值
- `-1`：文件没有 Bloom Filter

## 示例

- 本地文件（不带 scheme）

    ```sql
    SELECT * FROM parquet_meta(
      "uri" = "/path/to/test.parquet"
    );
    ```

- S3 文件（带 scheme + 存储参数）

    ```sql
    SELECT * FROM parquet_meta(
      "uri" = "s3://bucket/path/test.parquet",
      "mode" = "parquet_schema",
      "s3.access_key" = "...",
      "s3.secret_key" = "...",
      "s3.endpoint" = "s3.xxx.com",
      "s3.region" = "us-east-1"
    );
    ```

- 使用通配符（glob）

    ```sql
    SELECT file_name FROM parquet_meta(
      "uri" = "s3://bucket/path/*meta.parquet",
      "mode" = "parquet_file_metadata"
    );
    ```

- 使用 `parquet_bloom_probe` 模式

    ```sql
    select * from parquet_meta(
        "uri" = "${basePath}/bloommeta.parquet",
        "mode" = "parquet_bloom_probe",
        "column" = "col",
        "value" = 500,
        "s3.access_key" = "${ak}",
        "s3.secret_key" = "${sk}",
        "s3.endpoint" = "${endpoint}",
        "s3.region" = "${region}",
    );
    ```

## 说明与限制

- `parquet_meta` 只读取 Parquet Footer 元数据，不读取数据页，适合快速查看元信息。
- 支持通配符（如 `*`、`{}`、`[]`），若无匹配文件则会报错。
