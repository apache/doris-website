---
{
  "title": "PARQUET_META",
  "description": "parquet_meta table値関数（tvf）は、データページをスキャンすることなく Parquet ファイルの Footer メタデータを読み取るために使用できます。これにより、Row Group 統計、Schema、ファイルレベルメタデータ、KV メタデータ、および Bloom Filter プローブ結果を迅速に確認することができます。",
  "language": "ja"
}
---
`parquet_meta`table値関数（tvf）は、データページをスキャンすることなくParquetファイルのFooterメタデータを読み取るために使用できます。Row Group統計、Schema、ファイルレベルメタデータ、KVメタデータ、およびBloom Filterプローブ結果を素早く表示することができます。

> これは実験的機能であり、バージョン4.1.0以降でサポートされています。

## 構文

```sql
PARQUET_META(
    "uri" = "<uri>",
    "mode" = "<mode>",
    {OptionalParameters},
    {ConnectionParameters}
  );
```
- `uri`

  ファイルパス。

- `mode`

  メタデータクエリモード。オプション、デフォルトは`parquet_metadata`。値については「サポートされるモード」セクションを参照。

- `{OptionalParameters}`

  - `column`: モードが`parquet_bloom_probe`の場合に必須、調査するカラム名を指定します。
  - `value`: モードが`parquet_bloom_probe`の場合に必須、調査するリテラル値を指定します。

- `{ConnectionParameters}`

  ファイルが配置されているストレージシステムにアクセスするために必要なパラメータ。詳細については以下を参照：

  * [HDFS](../../../lakehouse/storages/hdfs.md)
  * [AWS S3](../../../lakehouse/storages/s3.md)
  * [Google Cloud Storage](../../../lakehouse/storages/gcs.md)
  * [Azure Blob](../../../lakehouse/storages/azure-blob.md)
  * [Alibaba Cloud OSS](../../../lakehouse/storages/aliyun-oss.md)
  * [Tencent Cloud COS](../../../lakehouse/storages/tencent-cos.md)
  * [Huawei Cloud OBS](../../../lakehouse/storages/huawei-obs.md)
  * [MinIO](../../../lakehouse/storages/minio.md)

## サポートされるモード

### `parquet_metadata`

デフォルトモード。

このモードはParquetファイルに含まれるメタデータをクエリするために使用できます。このメタデータはParquetファイルの様々な内部詳細（異なるカラムの統計情報など）を明らかにします。これによりParquetファイルでどのようなスキップ操作を実行できるかを判断でき、異なるカラムの内容について迅速な洞察を得ることも可能です。

| フィールド名 | 型 |
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

このモードはParquetファイルに含まれる内部スキーマをクエリするために使用できます。これはParquetファイルメタデータに含まれる構造であることに注意してください。

| フィールド名 | 型 |
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

このモードは、フォーマットバージョンや使用された暗号化アルゴリズムなどのファイルレベルメタデータをクエリするために使用できます。

| フィールド名 | 型 |
| --- | --- |
| file_name | STRING |
| created_by | STRING |
| num_rows | BIGINT |
| num_row_groups | BIGINT |
| format_version | BIGINT |
| encryption_algorithm | STRING |
| footer_signing_key_metadata | STRING |

### `parquet_kv_metadata`

このモードはキー・バリューペアとして定義されたカスタムメタデータをクエリするために使用できます。

| フィールド名 | 型 |
| --- | --- |
| file_name | STRING |
| key | STRING |
| value | STRING |

### `parquet_bloom_probe`

DorisはParquetファイルのBloom filterをデータフィルタリングとプルーニングに使用することをサポートしています。このモードは指定されたカラムとカラム値がBloom filterを通じて検出できるかどうかを検出するために使用されます。

| フィールド名 | 型 |
| --- | --- |
| file_name | STRING |
| row_group_id | INT |
| bloom_filter_excludes | INT |

`bloom_filter_excludes`の意味：

- `1`: Bloom FilterによりこのRow Groupに確実にこの値が含まれていないと判定
- `0`: Bloom Filterによりこの値が含まれている可能性があると判定
- `-1`: ファイルにBloom Filterが存在しない

## 例

- ローカルファイル（スキームなし）

    ```sql
    SELECT * FROM parquet_meta(
      "uri" = "/path/to/test.parquet"
    );
    ```
- S3ファイル（スキーマ + ストレージパラメータを含む）

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
- ワイルドカード（glob）の使用

    ```sql
    SELECT file_name FROM parquet_meta(
      "uri" = "s3://bucket/path/*meta.parquet",
      "mode" = "parquet_file_metadata"
    );
    ```
- `parquet_bloom_probe` モードの使用

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
## 注意事項と制限事項

- `parquet_meta`はParquet Footerメタデータのみを読み取り、データページは読み取らないため、メタデータを素早く表示するのに適しています。
- ワイルドカード（`*`、`{}`、`[]`など）をサポートしています。一致するファイルが見つからない場合、エラーが報告されます。
