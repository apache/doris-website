---
{
    "title": "Aliyun DLF",
    "language": "zh-CN",
    "description": "本文档介绍如何使用 CREATE CATALOG 语句连接并访问阿里云 Dake Lake Formation(DLF) 元数据服务。"
}
---

本文档介绍如何使用 `CREATE CATALOG` 语句连接并访问阿里云 [Dake Lake Formation(DLF)](https://www.alibabacloud.com/zh/product/datalake-formation) 元数据服务。

## DLF 版本说明

- 对于 DLF 1.0 版本，Doris 通过 DLF 的 Hive Metastore 兼容接口访问 DLF。支持 Paimon Catalog 和 Hive Catalog。
- 对于 DLF 2.5 之后的版本，Doris 通过 DLF 的 Rest 接口访问 DLF。仅支持 Paimon Catalog。

### DLF 1.0

| 参数名称 | 曾用名 | 描述 | 默认值 | 是否必须 |
|----------|--------|------|--------|----------|
| `dlf.endpoint` | - | DLF endpoint，详见：[阿里云文档](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | 无 | 是 |
| `dlf.region` | - | DLF region，详见：[阿里云文档](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | 无 | 是 |
| `dlf.uid` | - | 阿里云账号 ID。可在控制台右上角个人信息查看。 | 无 | 是 |
| `dlf.access_key` | - | 阿里云 AccessKey，用于访问 DLF 服务。 | 无 | 是 |
| `dlf.secret_key` | - | 阿里云 SecretKey，用于访问 DLF 服务。 | 无 | 是 |
| `dlf.catalog_id` | `dlf.catalog.id` | Catalog ID。用于指定元数据目录，如果不设置则使用默认目录。 | 无 | 否 |
| `warehouse` | - | Warehouse 的存储路径，仅在 Paimon Catalog 中需要填写。注意，对象存储路径，已经要以 `/` 结尾。 | 无 | 否 |

> 注：
>
> 3.1.0 版本之前，请使用曾用名。

### DLF 2.5+ (Rest Catalog)

> 自 3.1.0 版本支持

| 参数名称 | 曾用名 | 描述 | 默认值 | 是否必须 |
|----------|--------|------|--------|----------|
| `uri` | - | DLF REST URI。示例：http://cn-beijing-vpc.dlf.aliyuncs.com | 无 | 是 |
| `warehouse` | - | Warehouse 名称。注意这里直接填写需要连接的 Catalog 的名称，而非 Paimon 表存储路径 | 无 | 是 |
| `paimon.rest.token.provider` | - | token 提供方，固定填写 `dlf` | 无 | 是 |
| `paimon.rest.dlf.access-key-id` | - | 阿里云 AccessKey，用于访问 DLF 服务。 | 无 | 是 |
| `paimon.rest.dlf.access-key-secret` | - | 阿里云 SecretKey，用于访问 DLF 服务。 | 无 | 是 |

DLF Rest Catalog 无需提供存储服务（OSS）的 Endpoint 和 Region 等信息。Doris 会利用 DLF Rest Catalog 的 Vended Credential 获取用于访问 OSS 的临时凭证信息。

## 示例

### DLF 1.0

创建 Hive Catalog，以 DLF 作为元数据服务：

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

创建 Paimon Catalog，以 DLF 作为元数据服务：

```sql
CREATE CATALOG paimon_dlf PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'dlf',
    'warehouse' = 'oss://xx/yy/',
    'dlf.proxy.mode' = 'DLF_ONLY',
    'dlf.endpoint' = '<DLF_ENDPOINT>',
    'dlf.region' = '<DLF_REGION>',
    'dlf.uid' = '<YOUR_ALICLOUD_UID>',
    'dlf.access_key' = '<YOUR_ACCESS_KEY>',
    'dlf.secret_key' = '<YOUR_SECRET_KEY>'
);
```

### DLF 2.5+ (Rest Catalog)

```sql
CREATE CATALOG paimon_dlf_test PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'rest',
    'uri' = 'http://cn-beijing-vpc.dlf.aliyuncs.com',
    'warehouse' = 'my_catalog_name',
    'paimon.rest.token.provider' = 'dlf',
    'paimon.rest.dlf.access-key-id' = '<YOUR_ACCESS_KEY>',
    'paimon.rest.dlf.access-key-secret' = '<YOUR_SECRET_KEY>'
);
```
