---
{
    "title": "AWS Glue",
    "language": "zh-CN"
}
---

本文档介绍通过 `CREATE CATALOG` 使用 **AWS Glue Catalog** 访问 **Iceberg 表** 或 **Hive 表** 时的参数配置。

## Glue Catalog 支持的类型

AWS Glue Catalog 当前支持两种类型的 Catalog：

| Catalog 类型 | 类型标识 (`type`) | 描述                                        |
|-------------|------------------|---------------------------------------------|
| Hive        | glue             | 对接 Hive Metastore 的 Catalog             |
| Iceberg     | glue             | 对接 Iceberg 表格式                         |
| Iceberg     | rest             | 通过 Glue Rest Catalog 对接 Iceberg 表格式  |

本说明文档分别对这写类型的参数进行详细介绍，便于用户配置。

## Hive Glue Catalog

Hive Glue Catalog 用于访问 Hive 表，通过 AWS Glue 的 Hive Metastore 兼容接口访问 Glue。配置如下：

| 参数名称                   | 描述                                                      | 是否必须 | 默认值 |
|---------------------------|-----------------------------------------------------------|----------|--------|
| `type`                    | 固定为 `hms`                                              | 是       | 无     |
| `hive.metastore.type`     | 固定为 `glue`                                             | 是       | 无     |
| `glue.region`             | AWS Glue 所在区域，例如：`us-east-1`                      | 是       | 无     |
| `glue.endpoint`           | AWS Glue endpoint，例如：`https://glue.us-east-1.amazonaws.com` | 是       | 无     |
| `glue.access_key`         | AWS Access Key ID                                         | 是       | 空     |
| `glue.secret_key`         | AWS Secret Access Key                                     | 是       | 空     |
| `glue.catalog_id`         | Glue Catalog ID（暂未支持）                                | 否       | 空     |
| `glue.role_arn`           | IAM Role ARN，用于访问 Glue（暂未支持）                     | 否       | 空     |
| `glue.external_id`        | IAM External ID，用于访问 Glue（暂未支持）                  | 否       | 空     |

### 示例

```sql
CREATE CATALOG hive_glue_catalog WITH (
  'type' = 'hms',
  'hive.metastore.type' = 'glue',
  'glue.region' = 'us-east-1',
  'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
  'glue.access_key' = 'YOUR_ACCESS_KEY',
  'glue.secret_key' = 'YOUR_SECRET_KEY'
);
```

## Iceberg Glue Catalog

Iceberg Glue Catalog 通过 Glue Client 访问 Glue。配置如下：

| 参数名称                 | 描述                                                         | 是否必须 | 默认值     |
|-------------------------|--------------------------------------------------------------|----------|------------|
| `type`                  | 固定为 `iceberg`                                             | 是       | 无         |
| `iceberg.catalog.type`  | 固定为 `glue`                                               | 是       | 无         |
| `warehouse`             | Iceberg 数据仓库路径，例如：`s3://my-bucket/iceberg-warehouse/` | 是       | s3://doris |
| `glue.region`           | AWS Glue 所在区域，例如：`us-east-1`                        | 是       | 无         |
| `glue.endpoint`         | AWS Glue endpoint，例如：`https://glue.us-east-1.amazonaws.com` | 是       | 无         |
| `glue.access_key`       | AWS Access Key ID                                           | 是       | 空         |
| `glue.secret_key`       | AWS Secret Access Key                                       | 是       | 空         |
| `glue.catalog_id`       | Glue Catalog ID（暂未支持）                                  | 否       | 空         |
| `glue.role_arn`         | IAM Role ARN，用于访问 Glue（暂未支持）                      | 否       | 空         |
| `glue.external_id`      | IAM External ID，用于访问 Glue（暂未支持）                   | 否       | 空         |

### 示例

```sql
CREATE CATALOG iceberg_glue_catalog WITH (
  'type' = 'iceberg',
  'iceberg.catalog.type' = 'glue',
  'glue.region' = 'us-east-1',
  'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
  'glue.access_key' = '<YOUR_ACCESS_KEY>',
  'glue.secret_key' = '<YOUR_SECRET_KEY>'
);
```

## Iceberg Glue Rest Catalog

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

### 示例

```sql
CREATE CATALOG glue_s3 PROPERTIES (
  'type' = 'iceberg',
  'iceberg.catalog.type' = 'rest',
  'iceberg.rest.uri' = 'https://glue.<region>.amazonaws.com/iceberg',
  'iceberg.rest.warehouse' = '<acount_id>:s3tablescatalog/<s3_table_bucket_name>',
  'iceberg.rest.sigv4-enabled' = 'true',
  'iceberg.rest.signing-name' = 'glue',
  'iceberg.rest.access-key-id' = '<ak>',
  'iceberg.rest.secret-access-key' = '<sk>',
  'iceberg.rest.signing-region' = '<region>'
);
```
