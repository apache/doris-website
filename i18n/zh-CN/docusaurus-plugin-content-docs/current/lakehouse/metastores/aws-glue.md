---
{
    "title": "AWS Glue",
    "language": "zh-CN"
}
---

本文档介绍通过 `CREATE CATALOG` 使用 **AWS Glue Catalog** 访问 **Iceberg 表** 或 **Hive 表** 时的参数配置。

## 通用连接参数（适用于 Hive & Iceberg）

以下参数适用于 **Iceberg Glue Catalog** 和 **Hive Glue Catalog**：

| 属性名称           | 描述                                                                 | 是否必须 | 默认值 |
|--------------------|----------------------------------------------------------------------|----------|--------|
| `glue.region`      | AWS Glue 区域，例如：`us-east-1`                                     | 是       | 无     |
| `glue.endpoint`    | AWS Glue endpoint，例如：`https://glue.us-east-1.amazonaws.com`      | 是       | 无     |
| `glue.access_key`  | AWS Access Key ID                                                    | 是       | 空     |
| `glue.secret_key`  | AWS Secret Access Key                                                | 是       | 空     |
| `glue.catalog_id`  | Glue Catalog ID（尚未支持）                                           | 否       |        |
| `glue.role_arn`    | 用于访问 Glue 的 IAM Role ARN（尚未支持）                           | 否       |        |
| `glue.external_id` | 与 IAM Role 配合使用的 External ID（尚未支持）                      | 否       |        |

## Iceberg 表配置（使用 Glue Catalog）

配置示例：

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

## 三、Hive 表配置（使用 Glue 作为 HMS）

配置示例：

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

<!--
## 四、Hive Glue Catalog 专属参数

以下配置 **仅适用于 Hive Glue Catalog**，用于控制 Hive 使用 AWS Glue Metastore 客户端的行为。


### Glue 客户端缓存参数（**默认关闭**）

Glue 客户端提供元数据缓存（**仅支持 Hive Glue**）：

#### - 表缓存（Table Metadata Cache）

| 参数名称                         | 描述                                | 默认值  |
|----------------------------------|-------------------------------------|---------|
| `aws.glue.cache.table.enable`    | 是否启用表缓存                      | `false` |
| `aws.glue.cache.table.size`      | 表缓存的最大条目数                  | `1000`  |
| `aws.glue.cache.table.ttl-mins`  | 表缓存的存活时间（分钟）           | `30`    |

#### - 数据库缓存（Database Metadata Cache）

| 参数名称                      | 描述                                  | 默认值  |
|-------------------------------|---------------------------------------|---------|
| `aws.glue.cache.db.enable`    | 是否启用数据库缓存                   | `false` |
| `aws.glue.cache.db.size`      | 数据库缓存的最大条目数               | `1000`  |
| `aws.glue.cache.db.ttl-mins`  | 数据库缓存的存活时间（分钟）        | `30`    |

参考：
- [GetTable API](https://docs.aws.amazon.com/glue/latest/webapi/API_GetTable.html)
- [GetDatabase API](https://docs.aws.amazon.com/glue/latest/webapi/API_GetDatabase.html)
-->

## 注意事项

- 如果你使用的是 **Iceberg 表**，只需关注 **通用连接参数**。
- 如果你使用的是 **Hive 表** 并将 Glue 作为 Hive Metastore，需额外配置 Hive Glue 专属参数。
- **缓存机制目前仅在 Hive Glue 场景下有效**，Iceberg Glue Catalog 不使用这些参数。
