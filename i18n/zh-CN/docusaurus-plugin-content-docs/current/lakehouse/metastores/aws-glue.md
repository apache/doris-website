---
{
    "title": "AWS Glue",
    "language": "zh-CN"
}
---

# Glue Catalog 参数文档

本文档介绍通过 `CREATE CATALOG` 使用 **AWS Glue Catalog** 访问 **Iceberg 表** 或 **Hive 表** 时的参数配置。

---

## 一、Glue Catalog 支持的类型

AWS Glue Catalog 当前支持两种类型的 Catalog：

| Catalog 类型 | 类型标识 (`type`) | 描述                                |
|--------------|---------------|-------------------------------------|
| Hive         | glue          | 对接 Hive Metastore 的 Catalog      |
| Iceberg      | glue          | 对接 Iceberg 表格式                |


本说明文档分别对这两种类型的参数进行详细介绍，便于用户配置。

---

## 二、Iceberg Glue Catalog 参数总揽

Iceberg Glue Catalog 用于访问 Iceberg 表，必须配置以下参数：

| 参数名称                  | 描述                                                                    | 是否必须 | 默认值  |
|---------------------------|-------------------------------------------------------------------------|----------|---------|
| `type`                    | 固定为 `iceberg`                                                       | 是       | 无      |
| `iceberg.catalog.type`    | 固定为 `glue`                                                         | 是       | 无      |
| `warehouse`               | Iceberg 数据仓库路径，例如：`s3://my-bucket/iceberg-warehouse/`            | 是       | s3://doris     |
| `glue.region`             | AWS Glue 所在区域，例如：`us-east-1`                                   | 是       | 无      |
| `glue.endpoint`           | AWS Glue endpoint，例如：`https://glue.us-east-1.amazonaws.com`         | 是       | 无      |
| `glue.access_key`         | AWS Access Key ID                                                       | 是       | 空     |
| `glue.secret_key`         | AWS Secret Access Key                                                   | 是       | 空     |
| `glue.catalog_id`         | Glue Catalog ID（暂未支持）                                             | 否       | 空     |
| `glue.role_arn`           | IAM Role ARN，用于访问 Glue（暂未支持）                                | 否       | 空     |
| `glue.external_id`        | IAM External ID，用于访问 Glue（暂未支持）                            | 否       | 空     |

### Iceberg Glue Catalog 示例

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

---

## 三、Hive Glue Catalog 参数总揽

Hive Glue Catalog 用于访问 Hive 表，通过 AWS Glue 作为 Hive Metastore 服务，必须配置以下参数：

| 参数名称                           | 描述                                                                                              | 是否必须 | 默认值  |
|-----------------------------------|--------------------------------------------------------------------------------------------------|----------|---------|
| `type`                            | 固定为 `hms`                                                                                     | 是       | 无      |
| `hive.metastore.type`             | 固定为 `glue`                                                                                    | 是       | 无      |
| `glue.region`                     | AWS Glue 所在区域，例如：`us-east-1`                                                             | 是       | 无      |
| `glue.endpoint`                   | AWS Glue endpoint，例如：`https://glue.us-east-1.amazonaws.com`                                     | 是       | 无      |
| `glue.access_key`                 | AWS Access Key ID                                                                               | 是       | 空     |
| `glue.secret_key`                 | AWS Secret Access Key                                                                           | 是       | 空     |
| `glue.catalog_id`                 | Glue Catalog ID（暂未支持）                                                                      | 否       | 空     |
| `glue.role_arn`                   | IAM Role ARN，用于访问 Glue（暂未支持）                                                        | 否       | 空     |
| `glue.external_id`                | IAM External ID，用于访问 Glue（暂未支持）                                                     | 否       | 空     |

### Hive Glue Catalog 缓存参数（仅 Hive Glue 有效，默认关闭）

#### 表缓存

| 参数名称                         | 描述                         | 默认值  |
|----------------------------------|------------------------------|---------|
| `aws.glue.cache.table.enable`    | 是否启用表缓存              | `false` |
| `aws.glue.cache.table.size`      | 表缓存最大条目数            | `1000`  |
| `aws.glue.cache.table.ttl-mins`  | 表缓存存活时间（分钟）     | `30`    |

#### 数据库缓存

| 参数名称                      | 描述                         | 默认值  |
|-------------------------------|------------------------------|---------|
| `aws.glue.cache.db.enable`     | 是否启用数据库缓存          | `false` |
| `aws.glue.cache.db.size`       | 数据库缓存最大条目数        | `1000`  |
| `aws.glue.cache.db.ttl-mins`   | 数据库缓存存活时间（分钟）  | `30`    |

---

### Hive Glue Catalog 示例

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

---

## 四、Glue Catalog 认证方式说明

访问 AWS Glue Catalog 需要进行身份认证，目前支持的两种方式如下（**当前仅支持方式一**）：

### 方式一：使用 Access Key / Secret Key（已支持 ✅）

通过设置 `glue.access_key` 和 `glue.secret_key` 来进行静态身份认证。

| 参数名称           | 描述                                 | 是否必须 | 示例                           |
|--------------------|--------------------------------------|----------|--------------------------------|
| `glue.access_key`  | AWS Access Key ID，用于身份验证      | 是       | `AKIA***************`         |
| `glue.secret_key`  | AWS Secret Access Key                | 是       | `wJalrXUtnFEMI/K7MDENG/bPxRfi` |

#### 适用场景：
- 本地测试、开发环境
- 运行环境中没有统一的 IAM Role 授权管理
- 快速集成使用

#### 注意事项：
- AK/SK 具有权限管理风险，建议避免硬编码到代码或配置文件中。
- 在生产环境中推荐使用 IAM Role 的方式替代。

---

### 方式二：使用 IAM Role（暂未支持 ❌）

通过配置 `glue.role_arn` 和 `glue.external_id`，授权当前程序以某个角色的身份访问 Glue。

| 参数名称           | 描述                                                   | 是否必须 | 示例                                                                 |
|--------------------|--------------------------------------------------------|----------|----------------------------------------------------------------------|
| `glue.role_arn`    | 目标 IAM Role 的 ARN（Amazon Resource Name）          | 是（若启用此方式） | `arn:aws:iam::123456789012:role/MyGlueAccessRole`             |
| `glue.external_id` | 外部 ID，通常用于跨账号访问 Glue，防止角色被滥用       | 否       | `external-glue-id-abc123`                                            |

#### 适用场景：
- 生产环境中使用 **IAM Role 访问策略**进行权限管理
- 支持 **跨 AWS 账号** 的 Glue Catalog 访问
- 避免将 AK/SK 暴露在配置中，更加安全可靠

#### 注意事项：
- 当前此方式尚未在系统中实现，仅作参数预留。
- 启用此方式后，将忽略 `glue.access_key` 和 `glue.secret_key` 配置。
- 未来支持后可作为企业级 Glue 接入的推荐方式。

