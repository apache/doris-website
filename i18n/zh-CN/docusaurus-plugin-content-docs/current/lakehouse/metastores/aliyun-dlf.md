---
{
  "title": "Aliyun DLF",
  "language": "zh-CN"
}
---

# 阿里云 DLF MetaStore 使用说明

本文档介绍如何使用 `CREATE CATALOG` 语句连接阿里云 DLF Catalog，并支持 Hive、Iceberg、Paimon 表类型。每种类型均提供：

- ✅ 配置示例
- 🔐 认证方式说明
- ⚙️ 参数总览（统一表格）

---

## 🐝 Hive 表使用 DLF 作为 MetaStore

### 📑 参数总览

| 参数名称                  | 曾用名              | 描述                                                                                                    | 示例                             | 是否必须 | 默认值                   |
|-----------------------|------------------|-------------------------------------------------------------------------------------------------------|--------------------------------|------|-----------------------|
| `type`                |                  | Catalog 类型，Hive 使用 `hms`                                                                              | hms                            | ✅    | 无                     |
| `hive.metastore.type` |                  | Metastore 类型，这里为 `dlf`                                                                                | dlf                            | ✅    | 无                     |
| `dlf.endpoint`        |                  | DLF 服务的 Endpoint，详见 [阿里云官方文档](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | `dlf.cn-hangzhou.aliyuncs.com` | ✅    | 无                     |
| `dlf.region`          |                  | 所在区域 Region，同上链接                                                                                      | cn-hangzhou                    | ✅    | 无                     |
| `dlf.catalog.uid`     | `dlf.uid`        | 阿里云账号 UID，可在控制台右上角个人信息处查看                                                                             | `1234567890123456`             | ✅    | 无                     |
| `dlf.access_key`      |                  | 阿里云 AccessKey                                                                                         | `LA**********`                 | ✅    |
| `dlf.secret_key`      |                  | 阿里云 SecretKey                                                                                         | `ABCC*****                     | ✅    | 无                     |
| `dlf.catalog.id`      | `dlf.catalog_id` | 元数据目录 ID，多个 Catalog 场景下使用                                                                             | `HIVE`                         | 否    | 使用 dlf.catalog.uid 的值 |

### 🔐 认证方式说明

| 参数名称             | 描述                                                                      | 是否必须 |
|------------------|-------------------------------------------------------------------------|------|
| `dlf.access_key` | 阿里云 AccessKey，可在 [RAM 控制台](https://ram.console.aliyun.com/manage/ak) 获取 | ✅ 是  |
| `dlf.secret_key` | 与 AccessKey 配套的 SecretKey                                               | ✅ 是  |

### 🔧 配置示例

```sql
CREATE
CATALOG hive_dlf_catalog PROPERTIES (
  'type' = 'hms',
  'hive.metastore.type' = 'dlf',
   ----------- Meta Store Configuration -----------
  'dlf.endpoint' = '<DLF_ENDPOINT>',
  'dlf.region' = '<DLF_REGION>',
  'dlf.uid' = '<YOUR_ALICLOUD_UID>',
  'dlf.access_key' = '<YOUR_ACCESS_KEY>',
  'dlf.secret_key' = '<YOUR_SECRET_KEY>',
  'dlf.catalog.id' = '<OPTIONAL_CATALOG_ID>'
  ---------------- OSS Storage Configuration ----------------
   'oss.endpoint' = '<OSS_ENDPOINT>',
   'oss.region' = '<OSS_REGION>',   
   'oss.access_key' = '<YOUR_ACCESS_KEY>',
   'oss.secret_key' = '<YOUR_SECRET_KEY>'   
       
);
```

---

## Iceberg 表使用 DLF 作为 MetaStore

### 📑 参数总览

| 参数名称                   | 曾用名              | 描述                         | 示例                                 | 是否必须                    | 默认值 |
|------------------------|------------------|----------------------------|------------------------------------|-------------------------|-----|
| `type`                 |                  | Catalog 类型，固定为 `'iceberg'` | `iceberg`                          | ✅ 是                     |
| `iceberg.catalog.type` |                  | Metastore 类型               | `dlf`                              | ✅ 是                     |
| `dlf.endpoint`         |                  | DLF 服务 Endpoint            | `dlf.cn-hangzhou.aliyuncs.com`     | ✅ 是                     |
| `dlf.region`           |                  | DLF 所在 Region              | `cn-hangzhou`                      | ✅ 是                     |
| `dlf.catalog.uid`      | `dlf.uid`        | 阿里云账号 UID                  | `1234567890123456`                 | ✅ 是                     |
| `dlf.access_key`       |                  | 阿里云 AccessKey              | `LTAI************`                 | ✅ 是                     |
| `dlf.secret_key`       |                  | 阿里云 SecretKey              | `********************************` | ✅ 是                     |
| `warehouse`            |                  | 数据仓库路径（OSS）                | `oss://your-bucket/path/`          | ✅ 是                     |
| `dlf.catalog.id`       | `dlf.catalog_id` | Catalog ID                 | `iceberg-meta`                     | 否｜使用 dlf.catalog.uid 的值   |

### 🔐 认证方式说明

| 参数名称             | 描述            | 是否必须 |
|------------------|---------------|------|
| `dlf.access_key` | 阿里云 AccessKey | ✅ 是  |
| `dlf.secret_key` | 阿里云 SecretKey | ✅ 是  |

### 🔧 配置示例

```sql
CREATE
CATALOG iceberg_dlf_catalog PROPERTIES (
  'type' = 'iceberg',
  'iceberg.catalog.type' = 'dlf',
  ----------- Meta Store Configuration -----------     
  'warehouse' = 'oss://your-bucket/path/',
  'dlf.endpoint' = '<DLF_ENDPOINT>',
  'dlf.region' = '<DLF_REGION>',
  'dlf.uid' = '<YOUR_ALICLOUD_UID>',
  'dlf.access_key' = '<YOUR_ACCESS_KEY>',
  'dlf.secret_key' = '<YOUR_SECRET_KEY>',
  'dlf.catalog.id' = '<OPTIONAL_CATALOG_ID>',
  ---------------- OSS Storage Configuration ----------------
   'oss.endpoint' = '<OSS_ENDPOINT>',
   'oss.region' = '<OSS_REGION>',   
   'oss.access_key' = '<YOUR_ACCESS_KEY>',
   'oss.secret_key' = '<YOUR_SECRET_KEY>'   
);
```

---

## Paimon 表使用 DLF 作为 MetaStore

### 📑 参数总览

| 参数名称                  | 曾用名              | 描述         |示例            | 是否必须                               | 默认值                     |
|-----------------------|------------------|-------------------- |-------|------------------------------------|-------------------------|
| `type`                |                  | Catalog 类型，固定为 `'paimon'` | `paimon`                           | ✅ 是                     |
| `paimon.catalog.type` |                  | Metastore 类型，固定为 `'dlf'`  | `dlf`                              | ✅ 是                     |
| `warehouse`           |                  | OSS 仓库路径                  | `oss://your-bucket/paimon/`        | ✅ 是                     |
| `dlf.endpoint`        |                  | DLF 服务 Endpoint           | `dlf.cn-hangzhou.aliyuncs.com`     | ✅ 是                     |
| `dlf.region`          |                  | DLF 所在 Region             | `cn-hangzhou`                      | ✅ 是                     |
| `dlf.catalog.uid`     | `dlf.uid`        | 阿里云账号 UID                 | `1234567890123456`                 | ✅ 是                     |
| `dlf.access_key`      |                  | 阿里云 AccessKey             | `LTAI************`                 | ✅ 是                     |
| `dlf.secret_key`      |                  | 阿里云 SecretKey             | `********************************` | ✅ 是                     |
| `dlf.catalog.id`      | `dlf.catalog_id` | Catalog ID                | `paimon-meta`                      | 否 |使用 dlf.catalog.uid 的值 |

### 🔐 认证方式说明

| 参数名称             | 描述            | 是否必须 |
|------------------|---------------|------|
| `dlf.access_key` | 阿里云 AccessKey | ✅ 是  |
| `dlf.secret_key` | 阿里云 SecretKey | ✅ 是  |

### 🔧 配置示例

```sql
CREATE
CATALOG paimon_dlf_catalog PROPERTIES (
  'type' = 'paimon',
  'paimon.catalog.type' = 'dlf',
   ---------------- Meta Store Configuration -----------
  'warehouse' = 'oss://your-bucket/path/',
  'dlf.endpoint' = '<DLF_ENDPOINT>',
  'dlf.region' = '<DLF_REGION>',
  'dlf.uid' = '<YOUR_ALICLOUD_UID>',
  'dlf.access_key' = '<YOUR_ACCESS_KEY>',
  'dlf.secret_key' = '<YOUR_SECRET_KEY>',
  'dlf.catalog.id' = '<OPTIONAL_CATALOG_ID>'
   ---------------- OSS Storage Configuration ----------------
   'oss.endpoint' = '<OSS_ENDPOINT>',
   'oss.region' = '<OSS_REGION>',   
   'oss.access_key' = '<YOUR_ACCESS_KEY>',
   'oss.secret_key' = '<YOUR_SECRET_KEY>'   
);
```

## ⚠️ 常见注意事项

| 项目             | 说明                                    |
|----------------|---------------------------------------|
| 权限要求           | AccessKey 需具备访问 DLF 元数据服务、OSS 数据存储的权限 |
| 多 Catalog 场景支持 | 通过 `dlf.catalog.id` 指定不同的元数据目录        |
| 数据存储支持         | DLF 仅支持 Aliyun OSS 存储                 |
