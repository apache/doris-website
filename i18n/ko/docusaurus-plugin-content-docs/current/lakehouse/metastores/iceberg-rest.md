---
{
    "title": "Iceberg Rest Catalog API",
    "language": "ko",
    "description": "이 문서는 Iceberg Rest Catalog 인터페이스를 지원하는 메타데이터 서비스에 연결하고 액세스할 때 사용할 수 있는 매개변수를 설명합니다 "
}
---

이 문서는 `CREATE CATALOG` 문을 통해 Iceberg Rest Catalog 인터페이스를 지원하는 메타데이터 서비스에 연결하고 액세스할 때 사용할 수 있는 매개변수를 설명합니다.

## 매개변수 개요 {#parameter-overview}

| 속성 이름 | 이전 이름 | 설명 | 기본값 | 필수 여부 |
| --- | --- | --- | --- | --- | 
| iceberg.rest.uri | uri | Rest 서비스 주소를 지정합니다 | - | 예 |
| warehouse | warehouse | iceberg warehouse를 지정합니다 | - | 예 |
| iceberg.rest.security.type | | Rest 서비스의 인증 방식을 지정합니다. `oauth2`를 지원하며, 기본값은 `none`(인증 없음)입니다 | `none` | 아니요 |
| iceberg.rest.oauth2.token | | `oauth2` 인증을 사용할 때의 Bearer 토큰입니다 | - | 아니요 |
| iceberg.rest.oauth2.scope | | `oauth2` 인증을 사용할 때, 인증 후 사용자가 액세스할 수 있는 리소스 범위와 권한 수준을 지정합니다 | - | 아니요 |
| iceberg.rest.oauth2.credential | | `oauth2` 인증 정보로, `server-uri`에 액세스하여 토큰을 얻는 데 사용합니다 | - | 아니요 |
| iceberg.rest.oauth2.server-uri | | `oauth2` 토큰을 얻기 위한 URI 주소로, `iceberg.rest.oauth2.credential`과 함께 사용합니다 | - | 아니요 |
| iceberg.rest.vended-credentials-enabled | | `vended-credentials` 기능의 활성화 여부를 지정합니다. 활성화하면 rest 서버에서 `access-key`, `secret-key` 등의 스토리지 시스템 액세스 자격 증명을 가져오므로 수동으로 지정할 필요가 없습니다. rest 서버가 이 기능을 지원해야 합니다. | `false` | 아니요 |
| iceberg.rest.nested-namespace-enabled | | (버전 3.1.2+부터 지원) Nested Namespace 지원의 활성화 여부를 지정합니다. 기본값은 `false`입니다. `true`이면 Nested Namespace를 평탄화하여 `parent_ns.child_ns`와 같은 데이터베이스 이름으로 표시합니다. AWS Glue 등 일부 Rest Catalog 서비스는 Nested Namespace를 지원하지 않으므로 이 매개변수를 `false`로 설정해야 합니다 | 아니요 |

> 참고:
>
> 1. OAuth2 인증과 `vended-credentials` 기능은 버전 3.1.0부터 지원됩니다.
>
> 2. 3.1.0 이전 버전에서는 이전 이름을 사용하세요.
>
> 3. AWS Glue Rest Catalog에 대해서는 [AWS Glue 문서](./aws-glue.md)를 참조하세요.

## Nested Namespace {#nested-namespace}

3.1.2부터 Nested Namespace에 완전히 액세스하려면 Catalog 속성에서 `iceberg.rest.nested-namespace-enabled`를 `true`로 설정하는 것 외에도 다음 전역 매개변수를 활성화해야 합니다.

```
SET GLOBAL enable_nested_namespace=true;
```

Catalog가 "ice", Namespace가 "ns1.ns2", 테이블이 "tbl1"이라고 가정하면 다음과 같은 방법으로 Nested Namespace에 액세스할 수 있습니다.

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

## 구성 예제 {#example-configurations}

- 인증을 사용하지 않는 Rest Catalog 서비스

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

- AWS Glue Rest Catalog에 연결

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

- Databricks Unity Iceberg Rest Catalog에 연결

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

- Apache Polaris Rest Catalog에 연결

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

- Snowflake Open Catalog에 연결(3.1.2부터 지원)

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

- Apache Gravitino Rest Catalog에 연결

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

- SeaweedFS Rest Catalog에 연결

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

    SeaweedFS 테이블 버킷은 테이블 메타데이터를 위한 Iceberg REST Catalog를 제공하며, 동일한 S3 게이트웨이를 통해 테이블 데이터를 Parquet 파일로 저장합니다. 전체 과정은 [SeaweedFS와 통합](../best-practices/doris-seaweedfs.md)을 참조하세요.
