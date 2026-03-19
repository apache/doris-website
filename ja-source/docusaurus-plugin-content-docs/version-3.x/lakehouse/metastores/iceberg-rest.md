---
{
  "title": "Iceberg Rest カタログ API",
  "description": "この文書では、Iceberg Rest カタログインターフェースをサポートするメタデータサービスに接続し、アクセスする際にサポートされるパラメータについて説明します。",
  "language": "ja"
}
---
このドキュメントでは、`CREATE CATALOG`文を通じてIceberg Rest カタログインターフェースをサポートするメタデータサービスに接続し、アクセスする際にサポートされるパラメータについて説明します。

## パラメータ概要

| プロパティ名 | 従来名 | 説明 | デフォルト値 | 必須 |
| --- | --- | --- | --- | --- |
| iceberg.rest.uri | uri | Restサービスアドレスを指定 | - | Yes |
| warehouse | warehouse | icebergウェアハウスを指定 | - | Yes |
| iceberg.rest.security.type | | Restサービス認証方法を指定、`oauth2`をサポート、デフォルトは`none`（認証なし） | `none` | No |
| iceberg.rest.oauth2.token | | `oauth2`認証を使用する際のBearerトークン | - | No |
| iceberg.rest.oauth2.scope | | `oauth2`認証を使用する際に、認可後にユーザーがアクセスできるリソーススコープと権限レベルを指定 | - | No |
| iceberg.rest.oauth2.credential | | `server-uri`にアクセスしてトークンを取得するために使用される`oauth2`認証情報 | - | No |
| iceberg.rest.oauth2.server-uri | | `oauth2`トークンを取得するためのURIアドレス、`iceberg.rest.oauth2.credential`と組み合わせて使用 | - | No |
| iceberg.rest.vended-credentials-enabled | | `vended-credentials`機能を有効にするかどうか。有効にすると、restサーバーから`access-key`や`secret-key`などのストレージシステムアクセス認証情報を取得し、手動指定が不要になります。restサーバーがこの機能をサポートしている必要があります。 | `false` | No |
| iceberg.rest.nested-namespace-enabled | | （バージョン3.1.2+からサポート）Nested Namespaceのサポートを有効にするかどうか。デフォルトは`false`。`true`の場合、Nested Namespaceはフラット化され、`parent_ns.child_ns`のようにDatabase名として表示されます。AWS GlueなどのRest カタログサービスの一部はNested Namespaceをサポートしていないため、このパラメータは`false`に設定する必要があります | No |

> 注意：
>
> 1. OAuth2認証と`vended-credentials`機能はバージョン3.1.0からサポートされています。
>
> 2. 3.1.0より前のバージョンでは、従来名を使用してください。
>
> 3. AWS Glue Rest カタログについては、[AWS Glueドキュメント](./aws-glue.md)を参照してください

## Nested Namespace

3.1.2以降、Nested Namespaceに完全にアクセスするには、カタログプロパティで`iceberg.rest.nested-namespace-enabled`を`true`に設定することに加えて、以下のグローバルパラメータも有効にする必要があります：

```
SET GLOBAL enable_nested_namespace=true;
```
Catalogが"ice"、Namespaceが"ns1.ns2"、Tableが"tbl1"であると仮定すると、以下の方法でNested Namespaceにアクセスできます：

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

- 認証なしのRest Catalogサービス

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
- AWS Glue Rest Catalogへの接続

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
- Databricks Unity Iceberg Rest Catalogへの接続

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
- Apache Polaris Rest Catalogへの接続

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
- Snowflake Open Catalogへの接続（3.1.2以降）

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
- Apache Gravitino Rest Catalogへの接続

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
