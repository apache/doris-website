---
{
    "title": "集成阿里云 OSS Tables",
    "language": "zh-CN",
    "description": "使用 Iceberg REST Catalog 和 S3FileIO 将 Doris 接入阿里云 OSS Tables，实现托管 Iceberg 表的查询与写入。",
    "keywords": [
        "阿里云 OSS Tables",
        "Doris OSS Tables",
        "阿里云 OSS Tables 接入",
        "Iceberg REST Catalog",
        "S3FileIO",
        "OSS Table Bucket",
        "OSS Tables Catalog",
        "托管 Iceberg 表",
        "SigV4 osstables",
        "OSS Tables 403 Forbidden",
        "OSS STS 临时凭证",
        "Doris 湖仓"
    ]
}
---

<!-- 知识类型: 能力定义 + 集成指南 -->
<!-- 适用场景: 阿里云 OSS Tables 接入 / 托管 Iceberg 表查询与写入 -->

[阿里云 OSS Tables](https://help.aliyun.com/zh/oss/user-guide/oss-tables/) 是面向 Apache Iceberg 表的托管存储服务。OSS Tables 以 Table Bucket 作为存储单元，对外提供兼容 Apache Iceberg REST Catalog 的元数据接口，并通过 OSS 的 S3 兼容接口访问表数据。

相比在普通 OSS Bucket 中自行管理 Iceberg 表，OSS Tables 提供以下能力：

- 内置 Iceberg REST Catalog，无需部署 Hive Metastore 等外部元数据服务；
- 自动执行小文件合并、快照清理和未引用文件清理；
- 使用标准 Iceberg 接口，支持多个计算引擎访问同一份表数据。

Apache Doris 可以通过 Iceberg REST Catalog 接入 OSS Tables：使用 REST Catalog 管理 Namespace 和表元数据，使用 `S3FileIO` 读写数据文件。本文介绍如何在 Doris 中创建 OSS Tables Catalog，并查询和写入 Iceberg 表。

:::caution
该功能目前为实验功能，将在 Doris 5.0.0 版本中发布。
:::

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 创建 OSS Tables Catalog / 查询与写入 Iceberg 表 -->

## 使用指南

### 01 创建 OSS Table Bucket

在阿里云 OSS 控制台创建 Table Bucket。创建后，记录 Table Bucket ARN、地域和名称。ARN 格式如下：

```text
acs:osstables:<region>:<account_id>:bucket/<table_bucket_name>
```

创建具有目标 Table Bucket 访问权限的 RAM 用户 AccessKey，或获取 STS 临时凭证。确保 FE 节点可以访问 OSS Tables REST Catalog Endpoint，FE 和 BE 节点可以访问 OSS 数据访问 Endpoint。

OSS Tables 操作与 RAM 权限的对应关系，请参阅[阿里云 OSS Tables 权限与访问控制](https://help.aliyun.com/zh/oss/user-guide/oss-tables-access-control)。

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 配置 REST Catalog 鉴权和 S3FileIO 数据访问 -->

### 02 创建 Iceberg Catalog

将地域、账号 ID、Table Bucket 名称和访问凭证替换为实际值：

```sql
CREATE CATALOG oss_tables PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'https://<region>.oss-tables.aliyuncs.com/iceberg',
    'warehouse' = 'acs:osstables:<region>:<account_id>:bucket/<table_bucket_name>',

    'iceberg.rest.sigv4-enabled' = 'true',
    'iceberg.rest.signing-name' = 'osstables',
    'iceberg.rest.signing-region' = '<region>',
    'iceberg.rest.view-enabled' = 'false',

    'io-impl' = 'org.apache.iceberg.aws.s3.S3FileIO',
    'oss.endpoint' = 'https://oss-<region>.aliyuncs.com',
    'oss.region' = '<region>',
    'oss.access_key' = '<access_key_id>',
    'oss.secret_key' = '<access_key_secret>',
    'oss.use_path_style' = 'false',

    'test_connection' = 'true'
);
```

如需通过阿里云内网访问，将 `iceberg.rest.uri` 和 `oss.endpoint` 分别替换为 `https://<region>-internal.oss-tables.aliyuncs.com/iceberg` 和 `https://oss-<region>-internal.aliyuncs.com`。

使用 STS 临时凭证时，在 `oss.secret_key` 后增加 `oss.session_token`：

```sql
'oss.session_token' = '<sts_token>',
```

Doris 会将 `oss.access_key`、`oss.secret_key` 和可选的 `oss.session_token` 同时用于 REST Catalog 的 SigV4 签名和 `S3FileIO` 数据访问，无需重复配置 `iceberg.rest.access-key-id` 和 `iceberg.rest.secret-access-key`。

#### 参数说明

| 参数 | 是否必须 | 说明 |
| --- | --- | --- |
| `type` | 是 | 固定为 `iceberg`。 |
| `iceberg.catalog.type` | 是 | 固定为 `rest`，通过 Iceberg REST Catalog 访问 OSS Tables。 |
| `iceberg.rest.uri` | 是 | OSS Tables REST Catalog Endpoint。 |
| `warehouse` | 是 | Table Bucket ARN。 |
| `iceberg.rest.sigv4-enabled` | 是 | 固定为 `true`。 |
| `iceberg.rest.signing-name` | 是 | 固定为小写的 `osstables`。该值区分大小写。 |
| `iceberg.rest.signing-region` | 是 | SigV4 签名地域，必须与 Table Bucket 地域一致。 |
| `iceberg.rest.view-enabled` | 是 | 设置为 `false`。OSS Tables 当前不支持 Iceberg View 接口。 |
| `io-impl` | 是 | 固定为 `org.apache.iceberg.aws.s3.S3FileIO`。不要使用 `HadoopFileIO`。 |
| `oss.endpoint` | 是 | `S3FileIO` 访问 OSS 数据文件的 Endpoint。 |
| `oss.region` | 是 | OSS 数据访问地域，必须与 Table Bucket 地域一致。 |
| `oss.access_key` | 是 | 阿里云 AccessKey ID。 |
| `oss.secret_key` | 是 | 阿里云 AccessKey Secret。 |
| `oss.session_token` | 否 | 使用 STS 临时凭证时设置。 |
| `oss.use_path_style` | 否 | 是否使用 Path Style，默认值为 `false`。 |
| `test_connection` | 否 | 设置为 `true` 时，Doris 在创建 Catalog 时检查 REST Catalog 连接和鉴权。 |

`test_connection=true` 不会替代数据访问验证。Catalog 创建成功后，仍需执行一次实际查询或写入，确认 FE、BE 到 OSS 数据访问 Endpoint 的网络和权限均正常。

### 03 访问 OSS Tables

```sql
SWITCH oss_tables;

SHOW DATABASES;

USE <namespace_name>;

SHOW TABLES;

SELECT * FROM <table_name> LIMIT 10;
```

<!-- 知识类型: 操作示例 -->
<!-- 适用场景: 创建 Iceberg 表并向 OSS Tables 写入数据 -->

### 04 创建 OSS Tables 表并写入数据

```sql
SWITCH oss_tables;

CREATE DATABASE IF NOT EXISTS doris_demo;
USE doris_demo;

CREATE TABLE orders (
    order_id BIGINT,
    customer STRING,
    amount DECIMAL(10, 2),
    created_at DATETIME
)
PROPERTIES (
    'format-version' = '2',
    'write-format' = 'parquet',
    'write.format.default' = 'parquet',
    'write.parquet.compression-codec' = 'zstd'
);

INSERT INTO orders VALUES
    (1, 'Alice', 99.50, '2026-08-11 10:00:00'),
    (2, 'Bob', 120.00, '2026-08-11 10:01:00');

SELECT order_id, customer, amount, created_at
FROM orders
ORDER BY order_id;
```

可以通过 Iceberg `$files` 元数据表确认数据文件已经写入 OSS Tables：

```sql
SELECT file_path, file_format, record_count
FROM `orders$files`
ORDER BY file_path;
```

<!-- 知识类型: 使用限制 + 使用建议 -->

## 注意事项

- OSS Tables 仅支持 Iceberg 表格式。
- `iceberg.rest.signing-name` 必须设置为小写的 `osstables`，并同时设置正确的 `iceberg.rest.signing-region` 和 `iceberg.rest.sigv4-enabled=true`。
- 使用 STS 临时凭证时，需要在凭证过期前更新 Catalog 中的 AK、SK 和 Token。

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 403 鉴权失败 / 元数据访问成功但数据查询失败 -->

## 常见问题

### 创建 Catalog 返回 403 Forbidden

检查以下配置：

- `oss.access_key` 和 `oss.secret_key` 是否有效；使用 STS 临时凭证时，同时检查 `oss.session_token` 是否正确且未过期；
- RAM 用户或 STS 身份是否具有目标 Table Bucket 的 `oss:GetTableBucket` 和 `oss:ListNamespaces` 权限；
- `warehouse` 中的账号 ID、地域和 Table Bucket 名称是否正确；
- `iceberg.rest.signing-name` 是否为 `osstables`，`iceberg.rest.signing-region` 是否为 Table Bucket 所在地域。

### 可以查看 Namespace 和表，但查询数据失败

检查 FE 和所有 BE 节点是否能够访问 `oss.endpoint`，以及 RAM 用户或 STS 身份是否具有 `oss:GetTableMetadataLocation` 和 `oss:GetTableData` 权限。

OSS Tables 操作所需的完整权限，请参阅[阿里云 OSS Tables 权限与访问控制](https://help.aliyun.com/zh/oss/user-guide/oss-tables-access-control)。
