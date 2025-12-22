---
{
    "title": "AWS Glue",
    "language": "zh-CN",
    "description": "本文档介绍通过 CREATE CATALOG 使用 AWS Glue Catalog 访问 Iceberg 表 或 Hive 表 时的参数配置。"
}
---

本文档介绍通过 `CREATE CATALOG` 使用 **AWS Glue Catalog** 访问 **Iceberg 表** 或 **Hive 表** 时的参数配置。

## Glue Catalog 支持的类型

AWS Glue Catalog 当前支持三种类型的 Catalog：

| Catalog 类型 | 类型标识 (`type`) | 描述                                        |
|-------------|------------------|---------------------------------------------|
| Hive        | glue             | 对接 Hive Metastore 的 Catalog             |
| Iceberg     | glue             | 对接 Iceberg 表格式                         |
| Iceberg     | rest             | 通过 Glue Rest Catalog 对接 Iceberg 表格式  |

本说明文档分别对这写类型的参数进行详细介绍，便于用户配置。

## 通用参数总览
| 参数名称                   | 描述                                                          | 是否必须 | 默认值 |
|---------------------------|-------------------------------------------------------------|------|--------|
| `glue.region`           | AWS Glue 所在区域，例如：`us-east-1`                                | 是       | 无         |
| `glue.endpoint`         | AWS Glue endpoint，例如：`https://glue.us-east-1.amazonaws.com` | 是       | 无         |
| `glue.access_key`       | AWS Access Key ID                                           | 是       | 空         |
| `glue.secret_key`       | AWS Secret Access Key                                       | 是       | 空         |
| `glue.catalog_id`       | Glue Catalog ID（暂未支持）                                       | 否       | 空         |
| `glue.role_arn`         | IAM Role ARN，用于访问 Glue（自 3.1.2+ 支持）                          | 否       | 空         |
| `glue.external_id`      | IAM External ID，用于访问 Glue（自 3.1.2+ 支持）                       | 否       | 空         |

### 认证参数

访问 Glue 需要认证信息，支持以下两种方式：

1. Access Key 认证

   通过 `glue.access_key` 和 `glue.secret_key` 提供的 Access Key 认证访问 Glue。

2. IAM Role 认证（自 3.1.2+ 起支持）

   通过 `glue.role_arn` 提供的 IAM Role 认证访问 Glue。  

   该方式需要 Doris 部署在 AWS EC2 上，并且 EC2 实例需要绑定一个 IAM Role，且该 Role 需要有访问 Glue 的权限。

   如果需要通过 External ID 进行访问，需要同时配置 `glue.external_id`。

注意事项：

- 两种方式必须至少配置一种，如果同时配置了两种方式，则优先使用 AccessKey 认证。

示例：

    ```sql
    CREATE CATALOG hive_glue_catalog PRPPERTIES (
      'type' = 'hms',
      'hive.metastore.type' = 'glue',
      'glue.region' = 'us-east-1',
      'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
      -- 使用 Access Key 认证
      'glue.access_key' = '<YOUR_ACCESS_KEY>',
      'glue.secret_key' = '<YOUR_SECRET_KEY>'
      -- 或者使用 IAM Role 认证
      -- 'glue.role_arn' = '<YOUR_ROLE_ARN>',
      -- 'glue.external_id' = '<YOUR_EXTERNAL_ID>'
    );
    ```

### Hive Glue Catalog

Hive Glue Catalog 用于访问 Hive 表，通过 AWS Glue 的 Hive Metastore 兼容接口访问 Glue。配置如下：

| 参数名称                   | 描述                                                      | 是否必须 | 默认值 |
|---------------------------|-----------------------------------------------------------|------|--------|
| `type`                    | 固定为 `hms`                                              | 是    | 无     |
| `hive.metastore.type`     | 固定为 `glue`                                             | 是    | 无     |
| `glue.region`             | AWS Glue 所在区域，例如：`us-east-1`                      | 是    | 无     |
| `glue.endpoint`           | AWS Glue endpoint，例如：`https://glue.us-east-1.amazonaws.com` | 是    | 无     |
| `glue.access_key`         | AWS Access Key ID                                         | 否    | 空     |
| `glue.secret_key`         | AWS Secret Access Key                                     | 否    | 空     |
| `glue.catalog_id`         | Glue Catalog ID（暂未支持）                                | 否    | 空     |
| `glue.role_arn`           | IAM Role ARN，用于访问 Glue                  | 否    | 空     |
| `glue.external_id`        | IAM External ID，用于访问 Glue                  | 否    | 空     |

#### 示例

```sql
CREATE CATALOG hive_glue_catalog PROPERTIES (
  'type' = 'hms',
  'hive.metastore.type' = 'glue',
  'glue.region' = 'us-east-1',
  'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
  'glue.access_key' = 'YOUR_ACCESS_KEY',
  'glue.secret_key' = 'YOUR_SECRET_KEY'
);
```

### Iceberg Glue Catalog

Iceberg Glue Catalog 通过 Glue Client 访问 Glue。配置如下：

| 参数名称                 | 描述                                                         | 是否必须 | 默认值     |
|-------------------------|--------------------------------------------------------------|------|------------|
| `type`                  | 固定为 `iceberg`                                             | 是    | 无         |
| `iceberg.catalog.type`  | 固定为 `glue`                                               | 是    | 无         |
| `warehouse`             | Iceberg 数据仓库路径，例如：`s3://my-bucket/iceberg-warehouse/` | 是    | s3://doris |
| `glue.region`           | AWS Glue 所在区域，例如：`us-east-1`                        | 是    | 无         |
| `glue.endpoint`         | AWS Glue endpoint，例如：`https://glue.us-east-1.amazonaws.com` | 是    | 无         |
| `glue.access_key`       | AWS Access Key ID                                           | 否    | 空         |
| `glue.secret_key`       | AWS Secret Access Key                                       | 否    | 空         |
| `glue.catalog_id`       | Glue Catalog ID（暂未支持）                                  | 否    | 空         |
| `glue.role_arn`         | IAM Role ARN，用于访问 Glue（暂未支持）                      | 否    | 空         |
| `glue.external_id`      | IAM External ID，用于访问 Glue（暂未支持）                   | 否    | 空         |

#### 示例

```sql
CREATE CATALOG iceberg_glue_catalog PROPERTIES (
  'type' = 'iceberg',
  'iceberg.catalog.type' = 'glue',
  'glue.region' = 'us-east-1',
  'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
  'glue.access_key' = '<YOUR_ACCESS_KEY>',
  'glue.secret_key' = '<YOUR_SECRET_KEY>'
);
```

### Iceberg Glue Rest Catalog

Iceberg Glue Rest Catalog 通过 Glue Rest Catalog 接口访问 Glue。目前仅支持存储在 AWS S3 Table Bucket 中的 Iceberg 表。配置如下：

| 参数名称                         | 描述                                                              | 是否必须 | 默认值 |
|----------------------------------|-------------------------------------------------------------------|----------|--------|
| `type`                           | 固定为 `iceberg`                                                  | 是       | 无     |
| `iceberg.catalog.type`           | 固定为 `rest`                                                     | 是       | 无     |
| `iceberg.rest.uri`               | Glue Rest 服务端点，例如：`https://glue.ap-east-1.amazonaws.com/iceberg` | 是       | 无     |
| `warehouse`                      | Iceberg 数据仓库路径，例如：`<account_id>:s3tablescatalog/<bucket_name>` | 是       | 无     |
| `iceberg.rest.sigv4-enabled`     | 启动 V4 签名格式，固定为 `true`                                    | 是       | 无     |
| `iceberg.rest.signing-name`      | 签名类型，固定为 `glue`                                           | 是       | 空     |
| `iceberg.rest.access-key-id`     | 访问 Glue 的 Access Key（同时也用于访问 S3 Bucket）                | 是       | 空     |
| `iceberg.rest.secret-access-key` | 访问 Glue 的 Secret Key（同时也用于访问 S3 Bucket）                | 是       | 空     |
| `iceberg.rest.signing-region`    | AWS Glue 所在区域，例如：`us-east-1`                              | 是       | 空     |

#### 示例

```sql
CREATE CATALOG glue_s3 PROPERTIES (
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


## 权限策略

根据使用场景不同，可以分为 **只读** 和 **读写** 两类策略。

### 1. 只读权限

只允许读取 Glue Catalog 的数据库和表信息。

``` json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GlueCatalogReadOnly",
      "Effect": "Allow",
      "Action": [
        "glue:GetCatalog",
        "glue:GetDatabase",
        "glue:GetDatabases",
        "glue:GetTable",
        "glue:GetTables",
        "glue:GetPartitions"
      ],
      "Resource": [
        "arn:aws:glue:<region>:<account-id>:catalog",
        "arn:aws:glue:<region>:<account-id>:database/*",
        "arn:aws:glue:<region>:<account-id>:table/*/*"
      ]
    }
  ]
}
```

### 2. 读写权限

在只读的基础上，允许创建 / 修改 / 删除数据库和表。

``` json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GlueCatalogReadWrite",
      "Effect": "Allow",
      "Action": [
        "glue:GetCatalog",
        "glue:GetDatabase",
        "glue:GetDatabases",
        "glue:GetTable",
        "glue:GetTables",
        "glue:GetPartitions",
        "glue:CreateDatabase",
        "glue:UpdateDatabase",
        "glue:DeleteDatabase",
        "glue:CreateTable",
        "glue:UpdateTable",
        "glue:DeleteTable"
      ],
      "Resource": [
        "arn:aws:glue:<region>:<account-id>:catalog",
        "arn:aws:glue:<region>:<account-id>:database/*",
        "arn:aws:glue:<region>:<account-id>:table/*/*"
      ]
    }
  ]
}
```

### 注意事项

1. 占位符替换

    - `<region>` → 你的 AWS 区域（如 `us-east-1`）。
    - `<account-id>` → 你的 AWS 账号 ID（12 位数字）。

2. 最小权限原则

    - 如果只做查询，不要授予写权限。
    - 可以替换 `*` 为具体数据库、表 ARN，进一步收紧权限。

3. S3 权限

    - 上述策略只涉及 Glue Catalog
    - 如果需要读取数据文件，还需额外授予 S3 权限（如 `s3:GetObject`, `s3:ListBucket` 等）。
