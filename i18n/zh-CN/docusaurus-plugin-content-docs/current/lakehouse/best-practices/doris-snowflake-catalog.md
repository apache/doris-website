---
{
    "title": "集成 Snowflake Catalog",
    "language": "zh-CN",
    "description": "本文介绍如何通过 Iceberg REST Catalog 将 Apache Doris 接入 Snowflake Horizon Catalog 和 Snowflake Open Catalog。"
}
---

Apache Doris 可以通过 Iceberg REST Catalog API 接入 Snowflake 的 Catalog 服务。通过该能力，Doris 可以查询 Snowflake 管理的 Iceberg 表，也可以在使用 Snowflake Open Catalog internal catalog 时创建和写入 Iceberg 表。

本文介绍两种 Snowflake Catalog 接入方式：

- **Snowflake Horizon Catalog**：用于访问现有 Snowflake 账号中的 Snowflake-managed Iceberg tables。
- **Snowflake Open Catalog**：Snowflake 托管的 Apache Polaris / Iceberg REST Catalog 服务，用于管理 Iceberg catalog、namespace 和 table。

## 选择 Horizon Catalog 还是 Open Catalog

| 项目 | Snowflake Horizon Catalog | Snowflake Open Catalog |
| --- | --- | --- |
| 主要场景 | 查询 Snowflake-managed Iceberg tables | 在 Snowflake Open Catalog 中管理 Iceberg tables |
| Doris `warehouse` | Snowflake database name | Open Catalog catalog name |
| 凭证 | Snowflake Programmatic Access Token，简称 PAT | Service connection `<client_id>:<client_secret>` |
| OAuth scope | `session:role:<ROLE_NAME>` | `PRINCIPAL_ROLE:<ROLE_NAME>` |
| 通过 Doris 建表 | 不推荐 | internal catalog 支持 |
| 通过 Doris 写入 | 写入已有 Snowflake-managed Iceberg table | 写入 internal catalog 中的表 |

如果表由 Snowflake 管理，使用 Horizon Catalog。如果希望 Doris 通过 Snowflake Open Catalog 创建和管理 Iceberg 表，使用 Open Catalog internal catalog。

> 注意：接入 Horizon Catalog 时，需要设置 `iceberg.rest.view-enabled = false`。（该功能自 Doris 4.0.6/4.1.1 版本支持）

### 存储访问模型

Horizon Catalog 用于 Snowflake-managed Iceberg tables，底层存储访问由 Snowflake 管理。Doris 通过 REST Catalog API 获取表 metadata，且在 `iceberg.rest.vended-credentials-enabled` 设置为 `true` 时，由 Snowflake 下发对象存储临时凭证。因此接入 Horizon Catalog 时，不需要在 Doris Catalog 中配置用户侧 AWS IAM role 或 S3 凭证。

Open Catalog internal catalog 使用 catalog 中配置的对象存储路径。如果该路径在 AWS S3 上，Open Catalog 需要一个可被其 assume 的 IAM role，用于读写 Iceberg metadata 和数据文件。在 IAM role trust policy 中，trust principal 指的是被允许调用 `sts:AssumeRole` 的 AWS principal。对于 Snowflake Open Catalog，需要使用 catalog storage details 中显示的 IAM user ARN 作为 trust principal，并配置同一页面提供的 External ID。External ID 用于将 assume role 限定到这一个 Open Catalog 集成，降低 confused-deputy 风险。

## 接入 Snowflake Horizon Catalog

### Snowflake 环境准备

Snowflake Horizon Catalog 通过 Iceberg REST Catalog API 暴露 Snowflake-managed Iceberg tables。

REST endpoint 如下：

```text
REST endpoint:
https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog

Token endpoint:
https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens
```

创建 Snowflake-managed Iceberg table：

```sql
CREATE OR REPLACE ICEBERG TABLE <database_name>.<schema_name>.<table_name> (
  ID BIGINT,
  NAME STRING
)
CATALOG = 'SNOWFLAKE'
EXTERNAL_VOLUME = 'SNOWFLAKE_MANAGED';
```

`SNOWFLAKE_MANAGED` 是 Snowflake 保留值，不是用户自建 external volume，因此不需要单独给 Doris 授权访问 external volume。

给 Doris 使用的 Snowflake role 授权：

```sql
GRANT USAGE ON DATABASE <database_name> TO ROLE <role_name>;
GRANT USAGE ON SCHEMA <database_name>.<schema_name> TO ROLE <role_name>;
GRANT SELECT ON TABLE <database_name>.<schema_name>.<table_name> TO ROLE <role_name>;
```

如果需要 Doris 写入表，继续授予写权限：

```sql
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE
ON TABLE <database_name>.<schema_name>.<table_name>
TO ROLE <role_name>;
```

为 service user 创建 Programmatic Access Token：

```sql
ALTER USER IF EXISTS <service_user>
ADD PAT <pat_name>
  DAYS_TO_EXPIRY = 7
  ROLE_RESTRICTION = '<role_name>'
  COMMENT = 'Horizon Iceberg REST access for Doris';
```

可以使用 token endpoint 验证 PAT：

```bash
curl -i --fail -X POST \
  "https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "scope=session:role:<role_name>" \
  --data-urlencode "client_secret=<PAT_token>"
```

### 在 Doris 中创建 Catalog

在 Doris 中创建 Iceberg REST Catalog：

```sql
CREATE CATALOG snowflake_horizon PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog',
    'warehouse' = '<snowflake_database_name>',
    'iceberg.rest.security.type' = 'oauth2',
    'iceberg.rest.oauth2.credential' = '<PAT_token>',
    'iceberg.rest.oauth2.server-uri' = 'https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens',
    'iceberg.rest.oauth2.scope' = 'session:role:<role_name>',
    'iceberg.rest.vended-credentials-enabled' = 'true',
    'client.region' = '<storage_region>',
    'iceberg.rest.nested-namespace-enabled' = 'true',
    'iceberg.rest.view-enabled' = 'false',
    'iceberg.rest.connection-timeout-ms' = '30000',
    'iceberg.rest.socket-timeout-ms' = '120000'
);
```

参数说明：

- `warehouse`：Snowflake database name，不是 Snowflake compute warehouse。
- `iceberg.rest.oauth2.credential`：Snowflake PAT。
- `iceberg.rest.oauth2.scope`：`session:role:<role_name>`。
- `iceberg.rest.vended-credentials-enabled`：允许 Snowflake 返回对象存储临时凭证。
- `client.region`：底层对象存储所在 region。
- `iceberg.rest.view-enabled`：接入 Horizon Catalog 时设置为 `false`。

### 访问 Horizon 表

Catalog 创建完成后，可以在 Doris 中查询 Snowflake-managed Iceberg tables：

```sql
SHOW DATABASES FROM snowflake_horizon;
SHOW TABLES FROM snowflake_horizon.<schema_name>;

SELECT COUNT(*)
FROM snowflake_horizon.<schema_name>.<table_name>;
```

示例结果：

```text
mysql> SHOW DATABASES FROM snowflake_horizon;
+--------------------+
| Database           |
+--------------------+
| PUBLIC             |
| information_schema |
| mysql              |
+--------------------+

mysql> SHOW TABLES FROM snowflake_horizon.PUBLIC;
+------------------+
| Tables_in_PUBLIC |
+------------------+
| DORIS_HORIZON_T  |
+------------------+

mysql> SELECT * FROM snowflake_horizon.PUBLIC.DORIS_HORIZON_T;
+------+-------+
| id   | name  |
+------+-------+
|    1 | alice |
|    2 | bob   |
+------+-------+
```

写入已有 Snowflake-managed Iceberg table：

```sql
INSERT INTO snowflake_horizon.<schema_name>.<table_name>
VALUES (1, 'doris_insert');
```

## 接入 Snowflake Open Catalog

Snowflake Open Catalog 是 Snowflake 托管的 Apache Polaris / Iceberg REST Catalog 服务。使用 Open Catalog 接入 Doris 时，先准备对象存储访问，再创建 Open Catalog catalog、namespace、catalog role 和 service connection。

REST endpoint 如下：

```text
REST endpoint:
https://<open_catalog_account_identifier>.snowflakecomputing.com/polaris/api/catalog

Token endpoint:
https://<open_catalog_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens
```

### AWS 环境准备

Open Catalog 会将 Iceberg metadata 和数据文件存放在 catalog 指定的对象存储路径中。如果使用 AWS S3，需要先准备 S3 bucket 和 IAM role。

#### 创建 S3 存储桶

创建用于存放 Iceberg 表数据的 S3 bucket：

```bash
aws s3 mb s3://<bucket_name> --region <region>
aws s3 ls | grep <bucket_name>
```

Open Catalog catalog 会使用该 bucket 下的一个路径作为 default base location，例如：

```text
s3://<bucket_name>/<catalog_prefix>/
```

#### 创建 S3 访问权限策略

创建 IAM policy，允许 Open Catalog 访问 catalog location。将以下内容保存为 `snowflake-open-catalog-s3-policy.json`：

```bash
cat > snowflake-open-catalog-s3-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:ListBucketMultipartUploads"
      ],
      "Resource": "arn:aws:s3:::<bucket_name>",
      "Condition": {
        "StringLike": {
          "s3:prefix": [
            "<catalog_prefix>",
            "<catalog_prefix>/*"
          ]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": "arn:aws:s3:::<bucket_name>/<catalog_prefix>/*"
    }
  ]
}
EOF
```

#### 创建 IAM Role

先创建一个临时 trust policy。Open Catalog catalog 创建完成后，再使用 Snowflake Open Catalog 提供的 IAM user ARN 和 External ID 更新 trust policy。

创建 `snowflake-open-catalog-trust-policy.json`：

```bash
cat > snowflake-open-catalog-trust-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<aws_account_id>:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
```

创建 IAM role 并绑定 S3 policy：

```bash
aws iam create-role \
    --role-name <open_catalog_role_name> \
    --assume-role-policy-document file://snowflake-open-catalog-trust-policy.json \
    --description "IAM role for Snowflake Open Catalog to access S3"

aws iam put-role-policy \
    --role-name <open_catalog_role_name> \
    --policy-name snowflake-open-catalog-s3-access \
    --policy-document file://snowflake-open-catalog-s3-policy.json
```

验证 IAM role 和 inline policy 已创建：

```bash
aws iam get-role --role-name <open_catalog_role_name>
aws iam list-role-policies --role-name <open_catalog_role_name>
```

记录 role ARN。创建 Open Catalog catalog 时需要填写该值：

```text
arn:aws:iam::<aws_account_id>:role/<open_catalog_role_name>
```

### Open Catalog 环境准备

创建 Open Catalog catalog。如果需要 Doris 创建和写入 Iceberg 表，请使用 **internal catalog**。

![Create a Snowflake Open Catalog catalog](/images/integrations/lakehouse/snowflake/open-catalog-create-catalog.png)

典型配置如下：

```text
name: <catalog_name>
type: INTERNAL
storage provider: S3
default base location: s3://<bucket_name>/<catalog_prefix>/
S3 role ARN: arn:aws:iam::<aws_account_id>:role/<open_catalog_role_name>
```

Open Catalog catalog 创建完成后，在 catalog details 页面中的 storage details 复制以下值：

- IAM user ARN
- External ID

然后使用 Snowflake Open Catalog 提供的精确值更新 IAM role trust relationship：

```bash
cat > snowflake-open-catalog-trust-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "<open_catalog_iam_user_arn>"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "<external_id>"
        }
      }
    }
  ]
}
EOF

aws iam update-assume-role-policy \
    --role-name <open_catalog_role_name> \
    --policy-document file://snowflake-open-catalog-trust-policy.json
```

不要在公开文档或截图中暴露 IAM user ARN、External ID 或真实 role ARN。

创建 namespace，例如 `public`。

> 图片占位：在 Snowflake Open Catalog 中创建 namespace。

创建 catalog role，并授予所需权限。

![Create a catalog role in Snowflake Open Catalog](/images/integrations/lakehouse/snowflake/open-catalog-create-catalog-role.png)

快速测试时可以授予 `CATALOG_MANAGE_CONTENT`。生产环境中建议按实际工作负载配置最小权限。

创建 Doris 使用的 service connection。

![Create a Snowflake Open Catalog service connection](/images/integrations/lakehouse/snowflake/open-catalog-service-connection.png)

典型配置如下：

```text
name: doris_connection
query engine: doris
principal role: <principal_role_name>
```

创建完成后，复制 client credentials。Doris 使用的凭证格式为 `<client_id>:<client_secret>`。

![Copy Snowflake Open Catalog service credentials](/images/integrations/lakehouse/snowflake/open-catalog-service-credentials.png)

不要将真实 client secret 写入公开文件或截图中。

### 在 Doris 中创建 Catalog

在 Doris 中创建 Iceberg REST Catalog：

```sql
CREATE CATALOG snowflake_open_catalog PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'https://<open_catalog_account_identifier>.snowflakecomputing.com/polaris/api/catalog',
    'warehouse' = '<open_catalog_catalog_name>',
    'iceberg.rest.security.type' = 'oauth2',
    'iceberg.rest.oauth2.credential' = '<client_id>:<client_secret>',
    'iceberg.rest.oauth2.server-uri' = 'https://<open_catalog_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens',
    'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:<principal_role_name>',
    'iceberg.rest.vended-credentials-enabled' = 'true',
    'client.region' = '<storage_region>',
    'iceberg.rest.nested-namespace-enabled' = 'true'
);
```

参数说明：

- `warehouse`：Open Catalog catalog name。
- `iceberg.rest.oauth2.credential`：service connection 凭证，格式为 `<client_id>:<client_secret>`。
- `iceberg.rest.oauth2.scope`：`PRINCIPAL_ROLE:<principal_role_name>`。
- `iceberg.rest.vended-credentials-enabled`：设置为 `true`，使 Doris 使用 Open Catalog 下发的临时凭证访问对象存储。
- `client.region`：对象存储所在 region。

### 访问和管理 Open Catalog 表

访问 Open Catalog namespace：

```sql
SHOW DATABASES FROM snowflake_open_catalog;
SHOW TABLES FROM snowflake_open_catalog.public;
```

通过 Doris 创建 Iceberg 表：

```sql
CREATE TABLE snowflake_open_catalog.public.doris_open_catalog_t (
  id INT,
  name STRING
)
PROPERTIES (
  'write-format' = 'parquet'
);
```

写入并查询数据：

```sql
INSERT INTO snowflake_open_catalog.public.doris_open_catalog_t
VALUES (1, 'open_catalog_insert');

SELECT *
FROM snowflake_open_catalog.public.doris_open_catalog_t
ORDER BY id;
```

## 总结

通过 Iceberg REST Catalog API，Apache Doris 可以接入 Snowflake Catalog 服务并分析 Snowflake 管理的 Iceberg 数据。

- 使用 Snowflake Horizon Catalog 查询 Snowflake-managed Iceberg tables。创建 Doris Catalog 时需要设置 `iceberg.rest.view-enabled = false`。
- 使用 Snowflake Open Catalog internal catalog，可以通过 Doris 创建、写入和查询 Open Catalog 管理的 Iceberg 表。
