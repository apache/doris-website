---
{
  "title": "PARQUET_META",
  "language": "ja",
  "description": "parquet_meta テーブル値関数（TVF）を使用すると、データページをスキャンせずに Parquet ファイルのフッターメタデータを読み取れます。行グループの統計情報、スキーマ、ファイルレベルのメタデータ、KV メタデータ、ブルームフィルターのプローブ結果をすばやく確認できます。"
}
---

`parquet_meta` テーブル値関数（TVF）を使用すると、データページをスキャンせずに Parquet ファイルのフッターメタデータを読み取れます。行グループの統計情報、スキーマ、ファイルレベルのメタデータ、KV メタデータ、ブルームフィルターのプローブ結果をすばやく確認できます。

> これは実験的な機能で、バージョン 4.1.0 以降でサポートされています。

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

  メタデータの問い合わせモード。省略可能で、デフォルトは `parquet_metadata` です。指定できる値については「サポートされるモード」を参照してください。

- `{OptionalParameters}`

  - `column`: `parquet_bloom_probe` モードでは必須です。プローブする列名を指定します。
  - `value`: `parquet_bloom_probe` モードでは必須です。プローブするリテラル値を指定します。

- `{ConnectionParameters}`

  ファイルが保存されているストレージシステムにアクセスするために必要なパラメータ。詳細については、以下を参照してください。

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

デフォルトのモードです。

このモードでは、Parquet ファイルに含まれるメタデータを問い合わせできます。このメタデータからは、各列の統計情報など、Parquet ファイルの内部情報が分かります。これにより、Parquet ファイルに対してどのようなスキップ処理を実行できるかを判断でき、各列の内容もすばやく把握できます。

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

このモードでは、Parquet ファイルに含まれる内部スキーマを問い合わせできます。これは Parquet ファイルのメタデータに含まれる構造であることに注意してください。

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

このモードでは、使用されたフォーマットのバージョンや暗号化アルゴリズムなど、ファイルレベルのメタデータを問い合わせできます。

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

このモードでは、キーと値のペアとして定義されたカスタムメタデータを問い合わせできます。

| フィールド名 | 型 |
| --- | --- |
| file_name | STRING |
| key | STRING |
| value | STRING |

### `parquet_bloom_probe`

Doris は、Parquet ファイル内のブルームフィルターを使用したデータのフィルタリングと枝刈りをサポートしています。このモードでは、指定した列と列値がブルームフィルターで検出できるかを調べます。

| フィールド名 | 型 |
| --- | --- |
| file_name | STRING |
| row_group_id | INT |
| bloom_filter_excludes | INT |

`bloom_filter_excludes` の値の意味は次のとおりです。

- `1`: ブルームフィルターにより、この行グループに指定した値が含まれないことが確定します。
- `0`: ブルームフィルターにより、この行グループに指定した値が含まれる可能性があると判定されます。
- `-1`: ファイルにブルームフィルターがありません。

## 例

- ローカルファイル（スキームなし）

    ```sql
    SELECT * FROM parquet_meta(
      "uri" = "/path/to/test.parquet"
    );
    ```

- S3 ファイル（スキームとストレージパラメータを指定）

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

## 注意事項と制限

- `parquet_meta` は Parquet ファイルのフッターメタデータのみを読み取り、データページは読み取りません。そのため、メタデータをすばやく確認するのに適しています。
- ワイルドカード（`*`、`{}`、`[]` など）をサポートします。一致するファイルが見つからない場合は、エラーが報告されます。
