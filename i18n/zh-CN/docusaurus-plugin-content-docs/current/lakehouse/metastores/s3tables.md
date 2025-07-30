---
{
  "title": "S3 Tables",
  "language": "zh-CN"
}
---

# S3tables Catalog (Iceberg)

本文档介绍如何通过 `CREATE CATALOG` 使用 Iceberg 的 `S3tables` Catalog，使用 S3 作为元数据存储。

## 支持的表类型

该 Catalog 类型支持 [Apache Iceberg](https://iceberg.apache.org/) 表。

## 参数总览

| 属性名称                            | 曾用名 | 描述                                                       | 默认值     | 是否必须 |
|-------------------------------------|--------|------------------------------------------------------------|------------|----------|
| `s3.region`                         |        | S3 所在的区域，例如：`us-east-1`。强烈建议配置                | 无         | 否       |
| `s3.endpoint`                       |        | S3 服务访问地址，例如：`s3.us-east-1.amazonaws.com`         | 无         | ✅ 是     |
| `s3.access_key`                     |        | AWS Access Key。用于基础身份验证                             | 无         | ✅ 是*    |
| `s3.secret_key`                     |        | AWS Secret Key。用于基础身份验证                             | 无         | ✅ 是*    |
| `s3.role_arn`                       |        | 使用 Assume Role 模式时指定的角色 ARN                        | 无         | 否       |
| `s3.external_id`                    |        | 配合 `s3.role_arn` 使用的 external ID，用于增强安全性           | 无         | 否       |
| `s3.use_path_style`                 |        | 是否使用 path-style（路径风格）访问。默认是 virtual-host 风格 | `false`    | 否       |
| `s3.connection.maximum`             |        | 最大连接数，适用于高并发场景                                  | `50`       | 否       |
| `s3.connection.request.timeout`     |        | 请求超时时间（毫秒），控制连接池中获取连接的等待超时              | `3000`     | 否       |
| `s3.connection.timeout`             |        | 建立连接的超时时间（毫秒）                                     | `1000`     | 否       |
> ✅ *说明：若使用 Assume Role 模式，则可省略 `s3.access_key` 和 `s3.secret_key`。

## 认证方式

S3tables Catalog 支持两种认证方式：

### 1. Access Key 模式（推荐测试环境使用）

通过配置 `s3.access_key` 和 `s3.secret_key` 实现基础认证，适用于本地或开发环境快速接入。

### 2. Assume Role 模式（推荐生产环境）

通过配置 `s3.role_arn` 和 `s3.external_id`，使用 IAM 角色授权方式访问 S3。适用于生产场景下的跨账户授权、安全性要求更高的环境。

- `s3.role_arn`：要 Assume 的目标 IAM Role ARN。
- `s3.external_id`：与 Role 配合的 external ID，用于增强安全性。


## 示例

```sql
CREATE CATALOG s3_iceberg_catalog WITH (
  'type' = 'iceberg',
  'type' = 'iceberg',
  'iceberg.catalog.type' = 's3tables',
  'warehouse' = 's3://my-bucket/warehouse',
  's3.endpoint' = 's3.us-east-1.amazonaws.com',
  's3.region' = 'us-east-1',
  's3.access_key' = 'YOUR_ACCESS_KEY',
  's3.secret_key' = 'YOUR_SECRET_KEY'
);
```

或使用 IAM Role：

```sql
CREATE CATALOG s3_iceberg_catalog WITH (
  'type' = 'iceberg',
  'iceberg.catalog.type' = 's3tables',
  'warehouse' = 's3://my-bucket/warehouse',
  's3.endpoint' = 's3.us-east-1.amazonaws.com',
  's3.region' = 'us-east-1',
  's3.role_arn' = 'arn:aws:iam::123456789012:role/my-role',
  's3.external_id' = 'my-external-id'
);
```
