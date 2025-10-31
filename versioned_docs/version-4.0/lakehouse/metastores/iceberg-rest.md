---
{
    "title": "Iceberg Rest Catalog API",
    "language": "en"
}
---

This document describes the supported parameters when connecting to and accessing metadata services that support the Iceberg Rest Catalog interface through the `CREATE CATALOG` statement.

## Parameter Overview

| Property Name | Legacy Name | Description | Default Value | Required |
| --- | --- | --- | --- | --- | 
| iceberg.rest.uri | uri | Specifies the Rest service address | - | Yes |
| warehouse | warehouse | Specifies the iceberg warehouse | - | Yes |
| iceberg.rest.security.type | | Specifies the Rest service authentication method, supports `oauth2`, defaults to `none` (no authentication) | `none` | No |
| iceberg.rest.oauth2.token | | Bearer token when using `oauth2` authentication | - | No |
| iceberg.rest.oauth2.scope | | Specifies the resource scope and permission level that users can access after authorization when using `oauth2` authentication | - | No |
| iceberg.rest.oauth2.credential | | `oauth2` credentials used to access `server-uri` to obtain token | - | No |
| iceberg.rest.oauth2.server-uri | | URI address for obtaining `oauth2` token, used in conjunction with `iceberg.rest.oauth2.credential` | - | No |
| iceberg.rest.vended-credentials-enabled | | Whether to enable `vended-credentials` functionality. When enabled, it will obtain storage system access credentials such as `access-key` and `secret-key` from the rest server, eliminating the need for manual specification. Requires rest server support for this capability. | `false` | No |
| iceberg.rest.nested-namespace-enabled | | (Supported since version 3.1.2+) Whether to enable support for Nested Namespace. Default is `false`. If `true`, Nested Namespace will be flattened and displayed as Database names, such as `parent_ns.child_ns`. Some Rest Catalog services do not support Nested Namespace, such as AWS Glue, so this parameter should be set to `false` | No |

> Note:
>
> 1. OAuth2 authentication and `vended-credentials` functionality are supported starting from version 3.1.0.
>
> 2. For versions prior to 3.1.0, please use the legacy names.
>
> 3. For AWS Glue Rest Catalog, please refer to the [AWS Glue documentation](./aws-glue.md)

## Nested Namespace

Since 3.1.2, to fully access Nested Namespace, in addition to setting `iceberg.rest.nested-namespace-enabled` to `true` in the Catalog properties, you also need to enable the following global parameter:

```
SET GLOBAL enable_nested_namespace=true;
```

Assuming the Catalog is "ice", Namespace is "ns1.ns2", and Table is "tbl1", you can access Nested Namespace in the following ways:

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

## Example Configurations

- Rest Catalog service without authentication

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

- Connecting to AWS Glue Rest Catalog

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

- Connecting to Databricks Unity Iceberg Rest Catalog

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

- Connecting to Apache Polaris Rest Catalog

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

- Connecting to Snowflake Open Catalog (Since 3.1.2)

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

- Connecting to Apache Gravitino Rest Catalog

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
