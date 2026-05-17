---
{
  "title": "PARQUET_META",
  "language": "en",
  "description": "The parquet_meta table-valued-function (tvf) can be used to read Footer metadata of Parquet files without scanning data pages. It allows for quickly viewing Row Group statistics, Schema, file-level metadata, KV metadata, and Bloom Filter probe results."
}
---

The `parquet_meta` table-valued-function (tvf) can be used to read Footer metadata of Parquet files without scanning data pages. It allows for quickly viewing Row Group statistics, Schema, file-level metadata, KV metadata, and Bloom Filter probe results.

> This is an experimental feature, supported since version 4.1.0.

## Syntax

```sql
PARQUET_META(
    "uri" = "<uri>",
    "mode" = "<mode>",
    {OptionalParameters},
    {ConnectionParameters}
  );
```

- `uri`

  File path.

- `mode`

  Metadata query mode. Optional, defaults to `parquet_metadata`. See "Supported Modes" section for values.

- `{OptionalParameters}`

  - `column`: Required when mode is `parquet_bloom_probe`, specifies the column name to probe.
  - `value`: Required when mode is `parquet_bloom_probe`, specifies the literal value to probe.

- `{ConnectionParameters}`

  Parameters required to access the storage system where the file is located. For details, see:

  * [HDFS](../../../lakehouse/storages/hdfs.md)
  * [AWS S3](../../../lakehouse/storages/s3.md)
  * [Google Cloud Storage](../../../lakehouse/storages/gcs.md)
  * [Azure Blob](../../../lakehouse/storages/azure-blob.md)
  * [Alibaba Cloud OSS](../../../lakehouse/storages/aliyun-oss.md)
  * [Tencent Cloud COS](../../../lakehouse/storages/tencent-cos.md)
  * [Huawei Cloud OBS](../../../lakehouse/storages/huawei-obs.md)
  * [MinIO](../../../lakehouse/storages/minio.md)

## Supported Modes

### `parquet_metadata`

Default mode.

This mode can be used to query metadata contained in Parquet files. This metadata reveals various internal details of the Parquet file, such as statistics for different columns. This helps determine what types of skip operations can be performed on Parquet files and can even provide quick insights into the content of different columns.

| Field Name | Type |
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

This mode can be used to query the internal schema contained in Parquet files. Note that this is the structure included in the Parquet file metadata.

| Field Name | Type |
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

This mode can be used to query file-level metadata, such as the format version and encryption algorithm used.

| Field Name | Type |
| --- | --- |
| file_name | STRING |
| created_by | STRING |
| num_rows | BIGINT |
| num_row_groups | BIGINT |
| format_version | BIGINT |
| encryption_algorithm | STRING |
| footer_signing_key_metadata | STRING |

### `parquet_kv_metadata`

This mode can be used to query custom metadata defined as key-value pairs.

| Field Name | Type |
| --- | --- |
| file_name | STRING |
| key | STRING |
| value | STRING |

### `parquet_bloom_probe`

Doris supports using Bloom filters in Parquet files for data filtering and pruning. This mode is used to detect whether a specified column and column value can be detected through the Bloom filter.

| Field Name | Type |
| --- | --- |
| file_name | STRING |
| row_group_id | INT |
| bloom_filter_excludes | INT |

Meaning of `bloom_filter_excludes`:

- `1`: Bloom Filter determines that this Row Group definitely does not contain this value
- `0`: Bloom Filter determines that it may contain this value
- `-1`: File does not have a Bloom Filter

## Examples

- Local file (without scheme)

    ```sql
    SELECT * FROM parquet_meta(
      "uri" = "/path/to/test.parquet"
    );
    ```

- S3 file (with scheme + storage parameters)

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

- Using wildcards (glob)

    ```sql
    SELECT file_name FROM parquet_meta(
      "uri" = "s3://bucket/path/*meta.parquet",
      "mode" = "parquet_file_metadata"
    );
    ```

- Using `parquet_bloom_probe` mode

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

## Notes and Limitations

- `parquet_meta` only reads Parquet Footer metadata, not data pages, making it suitable for quickly viewing metadata.
- Supports wildcards (such as `*`, `{}`, `[]`). If no matching files are found, an error will be reported.
