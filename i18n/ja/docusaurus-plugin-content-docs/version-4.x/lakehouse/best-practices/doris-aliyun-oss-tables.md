---
{
    "title": "Alibaba Cloud OSS Tables との連携",
    "language": "ja",
    "description": "Iceberg REST Catalog と S3FileIO を使用して Doris を Alibaba Cloud OSS Tables に接続し、マネージド Iceberg テーブルを読み書きします。",
    "keywords": [
        "Alibaba Cloud OSS Tables",
        "Apache Doris OSS Tables",
        "Iceberg REST Catalog",
        "S3FileIO",
        "OSS Table Bucket",
        "OSS Tables Catalog",
        "managed Iceberg tables",
        "SigV4 osstables",
        "OSS Tables 403 Forbidden",
        "OSS STS credentials",
        "Doris lakehouse"
    ]
}
---

<!-- Knowledge Type: Capability Definition + Integration Guide -->
<!-- Applicable Scenarios: Alibaba Cloud OSS Tables integration / Managed Iceberg table queries and writes -->

[Alibaba Cloud OSS Tables](https://www.alibabacloud.com/help/en/oss/user-guide/oss-tables/) は、Apache Iceberg テーブル向けのマネージドストレージサービスです。OSS Tables は Table Bucket をストレージ単位として使用し、Apache Iceberg REST Catalog と互換性のあるメタデータインターフェイスを公開します。テーブルデータには OSS の S3 互換インターフェイスを通じてアクセスできます。

通常の OSS Bucket で Iceberg テーブルを管理する場合と比べ、OSS Tables には次の機能があります。

- Iceberg REST Catalog が組み込まれているため、Hive Metastore などの外部メタデータサービスをデプロイする必要がありません。
- 小さなファイルの圧縮、スナップショットの期限切れ処理、孤立ファイルのクリーンアップが自動で行われます。
- 標準の Iceberg インターフェイスを通じて、複数のコンピュートエンジンから同じテーブルデータにアクセスできます。

Apache Doris は Iceberg REST Catalog を通じて OSS Tables に接続します。REST Catalog が名前空間とテーブルのメタデータを管理し、`S3FileIO` がデータファイルを読み書きします。このガイドでは、Doris で OSS Tables Catalog を作成し、Iceberg テーブルのクエリと書き込みを行う方法を説明します。

:::caution
この機能は実験的な機能で、Doris 4.1.4 以降でサポートされています。
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Creating an OSS Tables Catalog / Querying and writing Iceberg tables -->

## 利用ガイド {#usage-guide}

### 01 OSS Table Bucket を作成する {#01-create-an-oss-table-bucket}

Alibaba Cloud OSS コンソールで Table Bucket を作成します。作成後、Table Bucket の ARN、リージョン、名前を控えてください。ARN の形式は次のとおりです。

```text
acs:osstables:<region>:<account_id>:bucket/<table_bucket_name>
```

対象の Table Bucket にアクセスできる RAM ユーザーの AccessKey を作成するか、一時的な STS 認証情報を取得します。FE ノードが OSS Tables REST Catalog エンドポイントにアクセスでき、FE ノードと BE ノードが OSS データアクセスエンドポイントにアクセスできることを確認してください。

OSS Tables の各操作に必要な権限については、[Alibaba Cloud OSS Tables の権限とアクセス制御](https://www.alibabacloud.com/help/en/oss/user-guide/oss-tables-access-control)を参照してください。

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Configuring REST Catalog authentication and S3FileIO data access -->

### 02 Iceberg Catalog を作成する {#02-create-an-iceberg-catalog}

リージョン、アカウント ID、Table Bucket 名、アクセス認証情報を実際の値に置き換えます。

```sql
CREATE CATALOG oss_tables PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'https://<region>.oss-tables.aliyuncs.com/iceberg',
    'warehouse' = 'acs:osstables:<region>:<account_id>:bucket/<table_bucket_name>',

    'iceberg.rest.sigv4-enabled' = 'true',
    'iceberg.rest.signing-name' = 'osstables',
    'iceberg.rest.signing-region' = '<region>',
    'iceberg.rest.view-enabled' = 'false',

    'io-impl' = 'org.apache.iceberg.aws.s3.S3FileIO',
    'oss.endpoint' = 'https://oss-<region>.aliyuncs.com',
    'oss.region' = '<region>',
    'oss.access_key' = '<access_key_id>',
    'oss.secret_key' = '<access_key_secret>',
    'oss.use_path_style' = 'false',

    'test_connection' = 'true'
);
```

Alibaba Cloud の内部ネットワーク経由でアクセスする場合は、`iceberg.rest.uri` と `oss.endpoint` をそれぞれ `https://<region>-internal.oss-tables.aliyuncs.com/iceberg` と `https://oss-<region>-internal.aliyuncs.com` に置き換えます。

一時的な STS 認証情報を使用する場合は、`oss.session_token` を `oss.secret_key` の後に追加します。

```sql
'oss.session_token' = '<sts_token>',
```

Doris は `oss.access_key`、`oss.secret_key`、および省略可能な `oss.session_token` を、REST Catalog の SigV4 署名と `S3FileIO` によるデータアクセスの両方に使用します。`iceberg.rest.access-key-id` と `iceberg.rest.secret-access-key` を別途設定する必要はありません。

#### パラメータ {#parameters}

| パラメータ | 必須 | 説明 |
| --- | --- | --- |
| `type` | はい | `iceberg` を指定する必要があります。 |
| `iceberg.catalog.type` | はい | Iceberg REST Catalog を通じて OSS Tables にアクセスするため、`rest` を指定する必要があります。 |
| `iceberg.rest.uri` | はい | OSS Tables REST Catalog のエンドポイント。 |
| `warehouse` | はい | Table Bucket の ARN。 |
| `iceberg.rest.sigv4-enabled` | はい | `true` を指定する必要があります。 |
| `iceberg.rest.signing-name` | はい | 小文字の `osstables` を指定する必要があります。大文字と小文字は区別されます。 |
| `iceberg.rest.signing-region` | はい | SigV4 署名に使用するリージョン。Table Bucket のリージョンと一致させる必要があります。 |
| `iceberg.rest.view-enabled` | はい | `false` に設定します。OSS Tables は現在、Iceberg View インターフェイスをサポートしていません。 |
| `io-impl` | はい | `org.apache.iceberg.aws.s3.S3FileIO` を指定する必要があります。`HadoopFileIO` は使用しないでください。 |
| `oss.endpoint` | はい | `S3FileIO` が OSS のデータファイルへのアクセスに使用するエンドポイント。 |
| `oss.region` | はい | OSS データアクセスのリージョン。Table Bucket のリージョンと一致させる必要があります。 |
| `oss.access_key` | はい | Alibaba Cloud の AccessKey ID。 |
| `oss.secret_key` | はい | Alibaba Cloud の AccessKey Secret。 |
| `oss.session_token` | いいえ | 一時的な STS 認証情報を使用する場合に設定します。 |
| `oss.use_path_style` | いいえ | パス形式のアクセスを使用するかどうか。デフォルトは `false` です。 |
| `test_connection` | いいえ | `true` に設定すると、Doris は Catalog の作成時に REST Catalog への接続と認証を確認します。 |

`test_connection=true` はデータアクセスの検証に代わるものではありません。Catalog の作成後、実際にクエリまたは書き込みを実行し、FE ノードと BE ノードから OSS データアクセスエンドポイントへのネットワーク接続とアクセス権限を確認してください。

### 03 OSS Tables にアクセスする {#03-access-oss-tables}

```sql
SWITCH oss_tables;

SHOW DATABASES;

USE <namespace_name>;

SHOW TABLES;

SELECT * FROM <table_name> LIMIT 10;
```

<!-- Knowledge Type: Operational Example -->
<!-- Applicable Scenarios: Creating an Iceberg table and writing data to OSS Tables -->

### 04 OSS Tables にテーブルを作成してデータを書き込む {#04-create-an-oss-tables-table-and-write-data}

```sql
SWITCH oss_tables;

CREATE DATABASE IF NOT EXISTS doris_demo;
USE doris_demo;

CREATE TABLE orders (
    order_id BIGINT,
    customer STRING,
    amount DECIMAL(10, 2),
    created_at DATETIME
)
PROPERTIES (
    'format-version' = '2',
    'write-format' = 'parquet',
    'write.format.default' = 'parquet',
    'write.parquet.compression-codec' = 'zstd'
);

INSERT INTO orders VALUES
    (1, 'Alice', 99.50, '2026-08-11 10:00:00'),
    (2, 'Bob', 120.00, '2026-08-11 10:01:00');

SELECT order_id, customer, amount, created_at
FROM orders
ORDER BY order_id;
```

```text
order_id  customer  amount  created_at
1         Alice     99.50   2026-08-11 10:00:00
2         Bob       120.00  2026-08-11 10:01:00
```

Iceberg の `$files` メタデータテーブルをクエリすると、データファイルが OSS Tables に書き込まれたことを確認できます。

```sql
SELECT file_path, file_format, record_count
FROM `orders$files`
ORDER BY file_path;
```

<!-- Knowledge Type: Limitations + Usage Guidance -->

## 利用上の注意 {#usage-notes}

- OSS Tables がサポートするテーブル形式は Iceberg のみです。
- `iceberg.rest.signing-name` には小文字の `osstables` を指定する必要があります。また、`iceberg.rest.signing-region` に正しいリージョンを指定し、`iceberg.rest.sigv4-enabled` を `true` に設定する必要があります。
- 一時的な STS 認証情報を使用する場合は、有効期限が切れる前に Catalog 内の AK、SK、トークンを更新してください。

<!-- Knowledge Type: Troubleshooting -->
<!-- Applicable Scenarios: 403 authentication errors / Metadata access succeeds but data queries fail -->

## FAQ {#faq}

### Catalog の作成時に 403 Forbidden が返される {#creating-the-catalog-returns-403-forbidden}

次の設定を確認してください。

- `oss.access_key` と `oss.secret_key` が有効であることを確認します。一時的な STS 認証情報を使用する場合は、`oss.session_token` が正しく、有効期限が切れていないことも確認します。
- RAM ユーザーまたは STS ID に、対象の Table Bucket に対する `oss:GetTableBucket` と `oss:ListNamespaces` の権限があることを確認します。
- `warehouse` に指定したアカウント ID、リージョン、Table Bucket 名が正しいことを確認します。
- `iceberg.rest.signing-name` が `osstables` であり、`iceberg.rest.signing-region` が Table Bucket のリージョンであることを確認します。

### 名前空間とテーブルは表示されるが、データのクエリに失敗する {#namespaces-and-tables-are-visible-but-data-queries-fail}

FE ノードとすべての BE ノードが `oss.endpoint` にアクセスできること、および RAM ユーザーまたは STS ID に `oss:GetTableMetadataLocation` と `oss:GetTableData` の権限があることを確認します。

OSS Tables の操作に必要な権限の完全な一覧については、[Alibaba Cloud OSS Tables の権限とアクセス制御](https://www.alibabacloud.com/help/en/oss/user-guide/oss-tables-access-control)を参照してください。
