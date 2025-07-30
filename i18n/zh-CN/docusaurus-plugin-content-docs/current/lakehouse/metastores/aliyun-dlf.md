---
{
    "title": "Aliyun DLF",
    "language": "zh-CN"
}
---

# 阿里云 DLF Catalog 参数配置文档（Hive 表）

本文档介绍如何使用 `CREATE CATALOG` 语句连接并访问 **阿里云 DLF** 中的 **Hive 表**，以及所需的参数说明。

---

## 一、支持类型

目前 DLF Catalog 仅支持 Hive 表

---

## 二、Hive 表配置示例（DLF Catalog）

以下为使用 DLF 作为 Hive Metastore 创建 Catalog 的示例：

```sql
CREATE CATALOG hive_dlf_catalog WITH (
  'type' = 'hms',
  'hive.metastore.type' = 'dlf',
  'dlf.endpoint' = '<DLF_ENDPOINT>',
  'dlf.region' = '<DLF_REGION>',
  'dlf.uid' = '<YOUR_ALICLOUD_UID>',
  'dlf.access_key' = '<YOUR_ACCESS_KEY>',
  'dlf.secret_key' = '<YOUR_SECRET_KEY>'
);
```

---

## 三、认证方式说明

DLF Catalog 当前仅支持通过 **AccessKey/SecretKey** 的方式进行认证。必须提供以下参数：

| 参数名称           | 描述                                                                 | 是否必须 |
|--------------------|----------------------------------------------------------------------|----------|
| `dlf.access_key`   | 阿里云 AccessKey。可在 [RAM 控制台](https://ram.console.aliyun.com/manage/ak) 获取。 | 是       |
| `dlf.secret_key`   | 阿里云 SecretKey。与 AccessKey 配套使用。                           | 是       |

---

## 四、参数总览（Hive）

| 参数名称            | 曾用名            | 描述                                                                                     | 默认值 | 是否必须 |
|---------------------|------------------|------------------------------------------------------------------------------------------|--------|----------|
| `dlf.endpoint`       |                  | DLF endpoint，详见：[阿里云文档](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | 无     | 是       |
| `dlf.region`         |                  | DLF region，详见：[阿里云文档](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints)   | 无     | 是       |
| `dlf.uid`            |                  | 阿里云账号 ID。可在控制台右上角个人信息查看。                                                  | 无     | 是       |
| `dlf.access_key`     |                  | 阿里云 AccessKey，用于访问 DLF 服务。                                                    | 无     | 是       |
| `dlf.secret_key`     |                  | 阿里云 SecretKey，用于访问 DLF 服务。                                                    | 无     | 是       |
| `dlf.catalog_id`     | `dlf.catalog.id` | Catalog ID。用于指定元数据目录，如果不设置则使用默认目录。                                     | 无     | 否       |

---

## 五、注意事项

- 当前 DLF Catalog 仅支持 Hive 表。
- 请确保您的 AccessKey/SecretKey 拥有访问 DLF 和 Hive 元数据服务的权限。
- `dlf.catalog_id` 暂非必需，仅当使用多个 Catalog 时使用。

