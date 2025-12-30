---
{
    "title": "Iceberg Rest Catalog API",
    "language": "zh-CN",
    "description": "本文档用于介绍通过 CREATE CATALOG 语句连接并访问支持 Iceberg Rest Catalog 接口的元数据服务时所支持的参数。"
}
---

本文档用于介绍通过 `CREATE CATALOG` 语句连接并访问支持 Iceberg Rest Catalog 接口的元数据服务时所支持的参数。

## 参数总览

|属性名称 | 曾用名 | 描述 | 默认值 | 是否必须 |
| --- | --- | --- | --- | --- | 
| iceberg.rest.uri | uri | 指定 Rest 服务地址 | - | 是 |
| warehouse | warehouse | 指定 iceberg warehouse | - | 是 |
| iceberg.rest.security.type | | 指定 Rest 服务认证方式，支持 `oauth2`，默认为 `none`，即无认证 | `none` | 否 |
| iceberg.rest.oauth2.token | | 当使用 `oauth2` 认证方式时，指定 bearer token | - | 否 |
| iceberg.rest.oauth2.scope | | 当使用 `oauth2` 认证方式时，指定用户授权后能够访问的资源范围和权限级别。| - | 否 |
| iceberg.rest.oauth2.credential | | `oauth2` 凭证，用于访问 `server-uri` 获取 token | - | 否 |
| iceberg.rest.oauth2.server-uri | | 用于获取 `oauth2` token 的 uri 地址，配合 `iceberg.rest.oauth2.credential` 使用 | - | 否 |
| iceberg.rest.vended-credentials-enabled | | 是否启用 `vended-credentials` 功能。启用后，会同 rest 服务端获取访问存储系统的凭证信息，如 `access-key` 和 `secret-key`，不再需要手动指定。需要 rest 服务端本身支持该能力。| `false` | 否 |
| iceberg.rest.nested-namespace-enabled | | （自 3.1.2+ 版本支持）是否启用对 Nested Namespace 的支持。默认为 `false`。如果为 `true`，则 Nested Namespace 会被打平作为 Database 名称显示，如 `parent_ns.child_ns`。某些 Rest Catalog 服务不支持 Nested Namespace，如 AWS Glue，责改参数需设置为 `false` | 否 |

> 注：
>
> 1. oauth2 认证和 `vended-credentials` 功能自 3.1.0 版本开始支持。
>
> 2. 3.1.0 之前的版本，请使用曾用名。
>
> 3. AWS Glue Rest Catalog 请参阅 [AWS Glue 文档](./aws-glue.md)

## Nested Namespace

在 3.1.2 及后续版本中，如需完整访问 Nested Namespace，除了在 Catalog 属性中将 `iceberg.rest.nested-namespace-enabled` 设置为 `true` 外，还需开启如下全局参数：

```
SET GLOBAL enable_nested_namespace=true;
```

假设 Catalog 为 "ice"，Namespace 为 "ns1.ns2"，Table 为 "tbl1"，可参考如下方式访问 Nested Namespace：

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

## 示例配置

- 无认证的 Rest Catalog 服务

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

- 连接 AWS Glue Rest Catalog

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

- 连接 Databricks Unity Iceberg Rest Catalog

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

- 连接 Apache Polaris Rest Catalog

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

- 连接 Snowflake Open Catalog (自 3.1.2 版本支持)

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

- 连接 Apache Gravitino Rest Catalog

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
