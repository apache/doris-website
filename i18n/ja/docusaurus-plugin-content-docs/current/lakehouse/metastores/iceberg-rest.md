---
{
    "title": "Iceberg Rest Catalog API",
    "language": "ja",
    "description": "CREATE CATALOG 文で Iceberg REST Catalog インターフェースに対応したメタデータサービスに接続し、アクセスする際に使用できるパラメータを説明します。"
}
---

`CREATE CATALOG` 文を使用して、Iceberg REST Catalog インターフェースに対応したメタデータサービスに接続し、アクセスする際に使用できるパラメータを説明します。

## パラメータの概要

| プロパティ名 | 旧名称 | 説明 | デフォルト値 | 必須 |
| --- | --- | --- | --- | --- | 
| iceberg.rest.uri | uri | REST サービスのアドレスを指定します。 | - | はい |
| warehouse | warehouse | Iceberg ウェアハウスを指定します。 | - | はい |
| iceberg.rest.security.type | | REST サービスの認証方式を指定します。`oauth2` に対応し、デフォルトは `none`（認証なし）です。 | `none` | いいえ |
| iceberg.rest.oauth2.token | | `oauth2` 認証で使用する Bearer トークンです。 | - | いいえ |
| iceberg.rest.oauth2.scope | | `oauth2` 認証時に、認可後のユーザーがアクセスできるリソースの範囲と権限レベルを指定します。 | - | いいえ |
| iceberg.rest.oauth2.credential | | `oauth2` 認証情報で、トークンを取得するために `server-uri` にアクセスする際に使用します。 | - | いいえ |
| iceberg.rest.oauth2.server-uri | | `oauth2` トークンの取得先 URI です。`iceberg.rest.oauth2.credential` と併用します。 | - | いいえ |
| iceberg.rest.vended-credentials-enabled | | `vended-credentials` 機能を有効にするかどうかを指定します。有効にすると、`access-key` や `secret-key` などのストレージシステムへのアクセス認証情報を REST サーバーから取得するため、手動で指定する必要がなくなります。この機能には REST サーバー側の対応が必要です。 | `false` | いいえ |
| iceberg.rest.nested-namespace-enabled | | （バージョン 3.1.2 以降で対応）ネストされた名前空間への対応を有効にするかどうかを指定します。デフォルトは `false` です。`true` の場合、ネストされた名前空間はフラット化され、`parent_ns.child_ns` のようなデータベース名として表示されます。AWS Glue など、一部の REST Catalog サービスはネストされた名前空間に対応していないため、このパラメータを `false` に設定してください。 | いいえ |

> 注：
>
> 1. OAuth2 認証と `vended-credentials` 機能は、バージョン 3.1.0 以降で対応しています。
>
> 2. バージョン 3.1.0 より前では、旧名称を使用してください。
>
> 3. AWS Glue REST Catalog については、[AWS Glue のドキュメント](./aws-glue.md)を参照してください。

## ネストされた名前空間

バージョン 3.1.2 以降でネストされた名前空間に完全にアクセスするには、Catalog のプロパティで `iceberg.rest.nested-namespace-enabled` を `true` に設定することに加え、次のグローバルパラメータを有効にする必要があります。

```
SET GLOBAL enable_nested_namespace=true;
```

Catalog が「ice」、名前空間が「ns1.ns2」、テーブルが「tbl1」の場合、次の方法でネストされた名前空間にアクセスできます。

```sql
mysql> USE ice.ns1.ns2;
mysql> SELECT k1 FROM ice.`ns1.ns2`.tbl1;
mysql> SELECT tbl1.k1 FROM `ns1.ns2`.tbl1;
mysql> SELECT `ns1.ns2`.tbl1.k1 FROM ice.`ns1.ns2`.tbl1;
mysql> SELECT ice.`ns1.ns2`.tbl1.k1 FROM tbl1;
mysql> REFRESH CATALOG ice;
mysql> REFRESH DATABASE ice.`ns1.ns2`;
mysql> REFRESH TABLE ice.`ns1.ns2`.tbl1;
```

## 設定例

- 認証を使用しない REST Catalog サービス

    ```sql
    CREATE CATALOG minio_iceberg PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'uri' = 'http://172.21.0.1:8181',
        's3.access_key' = '<ak>',
        's3.secret_key' = '<sk>',
        's3.endpoint' = 'http://10.0.0.1:9000',
        's3.region' = 'us-east-1'
    );
    ```

- AWS Glue REST Catalog への接続

    ```sql
    CREATE CATALOG glue_iceberg PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'https://glue.<region>.amazonaws.com/iceberg',
        'warehouse' = '<acount_id>:s3tablescatalog/<s3_table_bucket_name>',
        'iceberg.rest.sigv4-enabled' = 'true',
        'iceberg.rest.signing-name' = 'glue',
        'iceberg.rest.access-key-id' = '<ak>',
        'iceberg.rest.secret-access-key' = '<sk>',
        'iceberg.rest.signing-region' = '<region>'
    );
    ```

- Databricks Unity Iceberg REST Catalog への接続

    ```sql
    CREATE CATALOG unity_iceberg properties(
        "uri" = "https://dbc-59918a85-6c3a.cloud.databricks.com/api/2.1/unity-catalog/iceberg-rest/",
        "type" = "iceberg",
        "warehouse" = "<catalog_name>",
        "iceberg.catalog.type" = "rest",
        "iceberg.rest.security.type" = "oauth2",
        "iceberg.rest.oauth2.token" = "<token>",
        "iceberg.rest.vended-credentials-enabled" = "true",
        's3.endpoint' = 'https://s3.us-east-2.amazonaws.com',
        's3.region' = 'us-east-2'
    );
    ```

- Apache Polaris REST Catalog への接続

    ```sql
    -- Enable vended-credentials
    CREATE CATALOG polaris_iceberg PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog',
        'warehouse' = '<catalog_name>',
        'iceberg.rest.security.type' = 'oauth2',
        'iceberg.rest.oauth2.credential' = 'client_id:client_secret',
        'iceberg.rest.oauth2.server-uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog/v1/oauth/tokens',
        'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:doris_pr_role',
        'iceberg.rest.vended-credentials-enabled' = 'true',
        's3.endpoint' = 'https://s3.us-west-2.amazonaws.com',
        's3.region' = 'us-west-2'
    );

    -- Disable vended-credentials
    CREATE CATALOG polaris_iceberg PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog',
        'warehouse' = '<catalog_name>',
        'iceberg.rest.security.type' = 'oauth2',
        'iceberg.rest.oauth2.credential' = '6e155b128dc06c13:ce9fbb4cc91c43ff2955f2c6545239d7',
        'iceberg.rest.oauth2.server-uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog/v1/oauth/tokens',
        'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:doris_pr_role',
        's3.access_key' = '<ak>',
        's3.secret_key' = '<sk>',
        's3.endpoint' = 'https://s3.us-west-2.amazonaws.com',
        's3.region' = 'us-west-2'
    );
    ```

- Snowflake Open Catalog への接続（バージョン 3.1.2 以降）

    ```sql
    -- Enable vended-credentials
    CREATE CATALOG snowflake_open_catalog PROPERTIES (
        'type' = 'iceberg',
        'warehouse' = '<catalog_name>',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'https://<open_catalog_account>.snowflakecomputing.com/polaris/api/catalog',
        'iceberg.rest.security.type' = 'oauth2',
        'iceberg.rest.oauth2.credential' = '<client_id>:<client_secret>',
        'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:<principal_role>',
        'iceberg.rest.vended-credentials-enabled' = 'true',
        's3.endpoint' = 'https://s3.us-west-2.amazonaws.com',
        's3.region' = 'us-west-2',
        'iceberg.rest.nested-namespace-enabled' = 'true'
    );
    ```

    ```sql
    -- Disable vended-credentials
    CREATE CATALOG snowflake_open_catalog PROPERTIES (
        'type' = 'iceberg',
        'warehouse' = '<catalog_name>',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'https://<open_catalog_account>.snowflakecomputing.com/polaris/api/catalog',
        'iceberg.rest.security.type' = 'oauth2',
        'iceberg.rest.oauth2.credential' = '<client_id>:<client_secret>',
        'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:<principal_role>',
        's3.access_key' = '<ak>',
        's3.secret_key' = '<sk>',
        's3.endpoint' = 'https://s3.us-west-2.amazonaws.com',
        's3.region' = 'us-west-2',
        'iceberg.rest.nested-namespace-enabled' = 'true'
    );
    ```

- Apache Gravitino REST Catalog への接続

    ```sql
    -- Enable vended-credentials
    CREATE CATALOG gravitino_iceberg PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'http://127.0.0.1:9001/iceberg/',
        'warehouse' = 's3://gravitino-iceberg-demo/warehouse',
        'iceberg.rest.vended-credentials-enabled' = 'true',
        's3.endpoint' = 'https://s3.us-west-2.amazonaws.com',
        's3.region' = 'us-west-2'
    );

    -- Disable vended-credentials
    CREATE CATALOG gravitino_iceberg PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'http://127.0.0.1:9001/iceberg/',
        'warehouse' = 's3://gravitino-iceberg-demo/warehouse',
        'iceberg.rest.vended-credentials-enabled' = 'false',
        's3.access_key' = '<ak>',
        's3.secret_key' = '<sk>',
        's3.endpoint' = 'https://s3.us-west-2.amazonaws.com',
        's3.region' = 'us-west-2'
    );
    ```

- SeaweedFS REST Catalog への接続

    ```sql
    CREATE CATALOG seaweedfs_iceberg PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'uri' = 'http://<seaweedfs_host>:8181',
        'warehouse' = 's3://<table_bucket_name>',
        'credential' = '<ak>:<sk>',
        's3.access_key' = '<ak>',
        's3.secret_key' = '<sk>',
        's3.endpoint' = 'http://<seaweedfs_host>:8333',
        's3.region' = 'us-west-2',
        'use_path_style' = 'true'
    );
    ```

    SeaweedFS のテーブルバケットは、テーブルのメタデータを提供する Iceberg REST Catalog として機能し、テーブルデータを同じ S3 ゲートウェイの背後に Parquet ファイルとして保存します。手順全体については、[SeaweedFS との連携](../best-practices/doris-seaweedfs.md)を参照してください。
