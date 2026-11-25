---
{
    "title": "Iceberg 加密读取（PME）",
    "language": "zh-CN",
    "description": "了解 Apache Doris 5.0 通过 HMS 或 REST Catalog 读取 Iceberg v3 加密 Parquet 表的支持范围、KMS、私有双向 TLS、配置与限制。"
}
---

## 概述

Iceberg 加密读取计划自 Apache Doris **5.0.0** 起支持。Doris 通过 **Hive Metastore（HMS）或 REST Catalog** 读取 Iceberg v3 表，使用 Iceberg 标准加密管理器和原生 Parquet Modular Encryption（PME），支持算法为 `AES_GCM_V1`。

Doris 读取已经存在的加密表，不负责生成加密数据文件。该能力默认关闭，需要匹配的 FE、BE 和连接器插件、已配置的 KMS，以及 Doris 节点间经过认证的私有 RPC。

| 组件或操作 | 支持范围 |
| --- | --- |
| Catalog 与表版本 | HMS 或 REST；Iceberg v3 |
| 加密数据文件 | 原生 Parquet `AES_GCM_V1` |
| 加密 delete 文件 | Parquet position delete 和 equality delete，各自使用独立密钥 |
| Manifest 与 manifest list | 通过 Iceberg SDK 解密 |
| 混合文件 | 明文与加密的 Parquet data/delete 文件可以共存，各文件保留自己的加密元数据 |
| 查询 | 投影、过滤、聚合、JOIN、时间旅行和物理 COUNT |
| 原生 position-delete 元数据 | 通过原生 `$position_deletes` 路径读取 |
| 加密写入与维护 | 不支持 |
| 加密 Iceberg v4、ORC 或 Puffin 文件 | 不支持 |
| JNI 元数据表与 SQL 结果缓存 | 参见[使用限制](#使用限制) |

FE 从可信 Catalog 加载元数据，调用 KMS，并准备每个文件的密钥和 AAD。BE 通过受保护的私有 RPC 接收这些信息，解密 data 和 delete 文件。数据文件、position-delete 文件和 equality-delete 文件不会隐式继承彼此的密钥。

Iceberg 方案加密 data/delete 文件、manifest 和 manifest list，但不加密 metadata JSON；部署仍需保护 Catalog 和元数据的完整性。在外部创建加密表的方法见 [Iceberg 加密指南](https://github.com/apache/iceberg/blob/apache-iceberg-1.12.0/docs/docs/encryption.md)。

## 快速开始

### 前提条件

查询前准备以下条件：

- 由外部写入引擎创建的 Iceberg v3 表，使用 SDK 标准加密管理器、已配置的 KMS 和 `encryption.key-id`。仅设置属性不会转换已有明文文件。保留表的加密元数据和历史密钥。
- FE 能访问 Catalog、KMS 和对象存储，BE 能访问物理 data/delete 对象。读取需要解包相应表密钥的权限，例如 AWS KMS `Decrypt` 权限。
- 匹配的 Doris 5.0 FE、BE 和 Iceberg 连接器包，包含原生加密 Parquet reader 和私有 RPC provider。
- 集群 CA，以及每个节点独立的证书和私钥。节点证书必须受配置的集群 CA 信任。

以下示例假设已有表 `analytics.encrypted_events`，其 `id` 列包含 `1, 2, 3, 4`。请替换端点、身份、凭据和表名。由 Catalog 管理员执行配置，查询用户需要对应的表权限。

### 1. 配置私有双向 TLS

在所有参与查询的 FE 和 BE 上配置：

```properties
enable_tls=true
tls_verify_mode=verify_fail_if_no_peer_cert
tls_ca_certificate_path=<cluster-ca-certificate-path>
tls_cert_refresh_interval_seconds=0
```

在 FE 的 `fe.conf` 中增加：

```properties
tls_certificate_path=<fe-certificate-path>
tls_private_key_path=<fe-private-key-path>
tls_excluded_protocols=http,mysql,arrowflight,bdbje
thrift_server_type=THREAD_POOL
```

在 BE 的 `be.conf` 中增加：

```properties
tls_certificate_path=<be-certificate-path>
tls_private_key_path=<be-private-key-path>
tls_private_key_password=
tls_excluded_protocols=http,arrowflight
thrift_server_type_of_fe=THREAD_POOL
```

这些配置启用内置私有 RPC provider。FE 向 BE 下发执行片段，以及 BE 向 FE 获取 split 的 RPC，都必须受到保护。REST Catalog、KMS 或对象存储使用 HTTPS，不会自动配置这两条内部连接。SQL、HTTP 和其他被排除协议按各自机制管理配置。

该 provider 使用静态证书：`tls_cert_refresh_interval_seconds` 保持 `0`，`tls_peer_cert_required_san_dns` 保持为空。BE 私钥必须为未加密的 PEM 文件。在所有参与节点上协调启用 TLS，更换证书或信任文件后重启节点。配置框架见 [TLS 框架](../../../admin-manual/auth/tls-framework.md)。

### 2. 在 Iceberg 插件中启用加密读取

修改每个 FE 安装目录中的 `plugins/connector/iceberg/iceberg.conf`：

```properties
enable_encryption_read=true
```

修改后重启 FE。这是插件部署配置，**不是** Catalog 属性、Session 变量或 `fe.conf` 配置，默认值为 `false`。

在统一重启参与节点前，完成 TLS 和插件配置。外部扫描调度器可能选择的所有存活 BE，都必须提供新鲜的原生加密读取能力证明。插件开关不能跳过 reader、传输或能力检查。

### 3. 创建 Catalog

REST Catalog 认证、KMS 认证和对象存储认证分别解决不同问题。以下 REST 示例使用 OAuth2 访问 Catalog，并为 KMS 与 S3 配置独立的静态凭据：

```sql
CREATE CATALOG encrypted_lake PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'https://catalog.example.com',
    'iceberg.rest.security.type' = 'oauth2',
    'iceberg.rest.oauth2.credential' = '<client-id>:<client-secret>',
    'iceberg.rest.oauth2.server-uri' = 'https://auth.example.com/oauth/token',
    'iceberg.rest.oauth2.scope' = '<catalog-scope>',
    'io-impl' = 'org.apache.iceberg.aws.s3.S3FileIO',
    'encryption.kms-type' = 'aws',
    'client.region' = 'us-east-1',
    'client.credentials-provider' = 'org.apache.doris.connector.iceberg.glue.ConfigurationAWSCredentialsProvider2x',
    'client.credentials-provider.glue.access_key' = '<kms-access-key>',
    'client.credentials-provider.glue.secret_key' = '<kms-secret-key>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = '<storage-access-key>',
    's3.secret_key' = '<storage-secret-key>'
);
```

凭据 provider 属性名中的 `glue` 来自该 provider 的既有接口。此处用于为 KMS 的 SDK 客户端提供凭据，不会将 Catalog 类型改为 Glue。请使用 REST 服务实际要求的认证参数和 scope。其他认证模式见 [Iceberg Catalog](../iceberg-catalog.mdx)。

HMS 使用相同的加密和存储配置，连接部分改为 HMS：

```sql
CREATE CATALOG encrypted_hms PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hms',
    'hive.metastore.uris' = 'thrift://metastore.example.com:9083',
    'io-impl' = 'org.apache.iceberg.aws.s3.S3FileIO',
    'encryption.kms-type' = 'aws',
    'client.region' = 'us-east-1',
    'client.credentials-provider' = 'org.apache.doris.connector.iceberg.glue.ConfigurationAWSCredentialsProvider2x',
    'client.credentials-provider.glue.access_key' = '<kms-access-key>',
    'client.credentials-provider.glue.secret_key' = '<kms-secret-key>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = '<storage-access-key>',
    's3.secret_key' = '<storage-secret-key>'
);
```

示例使用 AWS KMS 兼容客户端。其他 KMS 实现需要对应的 SDK 兼容客户端和运维人员安装的本地依赖，不能由这些示例推断其已通过验证。按部署的凭据管理策略保护和管理凭据。

### 4. 查询表

```sql
SELECT id
FROM encrypted_lake.analytics.encrypted_events
ORDER BY id;
```

```text
1
2
3
4
```

如果 `encrypted_hms` 暴露同一张表，可通过该 Catalog 执行相同查询。成功执行原生加密查询才能证明 reader 与能力准入路径正常，仅能加载 REST 元数据不代表原生执行已经可用。

## 参数说明

| 参数 | 位置与类型 | 默认值 / 是否必需 | 作用 |
| --- | --- | --- | --- |
| `enable_encryption_read` | FE Iceberg 插件；布尔值 | `false`；加密读取必需 | 表达启用意图，需要重启 FE，不跳过执行检查 |
| `enable_tls` | FE 和 BE；布尔值 | `false`；此场景必需 | 启用已配置的 TLS provider |
| `tls_verify_mode` | FE 和 BE；字符串 | 设置为 `verify_fail_if_no_peer_cert` | 私有 RPC 要求受信任的对端证书 |
| `tls_certificate_path`、`tls_private_key_path`、`tls_ca_certificate_path` | 节点配置；路径 | 此场景必需 | 节点身份、私钥与集群信任，每个节点使用独立身份 |
| `tls_excluded_protocols` | 节点配置；协议列表 | 按上文设置 | 将内置私有 provider 不处理的协议分开配置 |
| `tls_cert_refresh_interval_seconds` | FE 和 BE；整数 | 此 provider 使用 `0` | 静态身份与信任配置，更换后重启 |
| `thrift_server_type`、`thrift_server_type_of_fe` | 分别配置在 FE 和 BE；字符串 | 设置为 `THREAD_POOL` | 选择此私有 RPC provider 支持的 Thrift 服务模式 |
| `encryption.kms-type` | Catalog；字符串 | 未使用 `encryption.kms-impl` 时必需 | 选择标准 SDK KMS 客户端，示例为 `aws` |
| `encryption.kms-impl` | Catalog；类名 | 预定义 KMS 类型的替代配置 | 使用运维人员已安装的 SDK 兼容 KMS 客户端 |
| `client.region` | Catalog；字符串 | SDK 环境未提供时指定 KMS 区域 | 选择 AWS 客户端区域 |
| `client.credentials-provider` 及其属性 | Catalog；类名与字符串 | 取决于部署的 KMS 认证方式 | 提供 SDK 凭据，示例使用内置静态 provider |
| `kms.endpoint` | Catalog；URI | 可选，默认使用 SDK 服务端点 | 覆盖为兼容 KMS 服务的端点 |
| `s3.*` | Catalog / 存储配置 | 取决于存储认证方式 | 控制物理对象访问，与 Catalog 和 KMS 凭据独立 |
| `encryption.key-id` | 已有外部表元数据 | 由外部写入端设置 | 标识 wrapping key，不要通过移除或修改该属性绕过加密 |

自定义 **KMS 客户端**与自定义**加密管理器**不同。此读取路径要求 SDK 标准加密管理器；安装 KMS 实现不会自动支持另一种文件加密方案。

## 使用示例

### 过滤与聚合

```sql
SELECT COUNT(*), SUM(id)
FROM encrypted_lake.analytics.encrypted_events
WHERE id >= 2;
```

```text
3  9
```

对于已声明加密的表，COUNT 生成物理扫描范围，不直接返回元数据计数。即使启用了外部表 COUNT 下推，执行仍包括权限验证和文件/delete 处理。

### 时间旅行

```sql
SELECT id
FROM encrypted_lake.analytics.encrypted_events
FOR VERSION AS OF <snapshot-id>
ORDER BY id;
```

从外部 Catalog 或 Iceberg 客户端获取快照 ID；加密 JNI `$snapshots` 查询尚不可用。结果为该快照可见的行。FE 必须能解包快照所需的所有密钥；当前写入端改用其他密钥后，保留的旧密钥仍可能需要使用。

### Position-delete 行

```sql
SELECT file_path, pos
FROM encrypted_lake.analytics.`encrypted_events$position_deletes`;
```

结果为与该表关联的 position-delete 记录。该查询使用原生 reader，不代表 `$files` 等 JNI 元数据表支持加密读取。

### 查询用户权限

```sql
CREATE USER pme_reader IDENTIFIED BY '<reader-password>';
GRANT SELECT_PRIV ON encrypted_lake.analytics.* TO pme_reader;
```

该用户查询时，部署仍需具备 Catalog、KMS 和存储访问权限。Doris 表权限不授予 KMS 权限，KMS 权限也不授予 Doris 表权限。

## 错误处理

| 错误分类 | 处理方式 |
| --- | --- |
| `READ_DISABLED` | 在所有 FE 的插件部署配置中启用开关并重启 |
| `BACKEND_CAPABILITY_UNAVAILABLE` | 检查包版本、私有双向 TLS、FE split 监听器，以及选定计算组内 BE 的新鲜能力证明 |
| `UNSUPPORTED_CATALOG` | 此读取路径使用 HMS 或 REST |
| `UNSUPPORTED_TABLE_FORMAT` | 使用加密 Iceberg v3 表，V4 加密不属于此能力 |
| `UNSUPPORTED_ENCRYPTION_MANAGER` | 检查是否使用 SDK 标准加密方案 |
| `UNSUPPORTED_FILE_FORMAT` | 检查实际加密 data/delete 文件；修改默认写入格式不会转换已有文件 |
| `UNSUPPORTED_METADATA_TABLE` | 使用已支持的原生查询，加密 JNI 元数据表扫描尚不可用 |
| `WRITE_UNAVAILABLE` | 使用兼容的外部写入引擎写入或维护加密表 |
| KMS 访问或认证失败 | 修复 KMS 凭据、权限和可用性，热查询不能回退到明文读取 |

密钥元数据或密文认证失败时，需要检查外部表的密钥与物理文件。诊断时保留原有元数据和密钥链。

## 使用限制

- 仅支持读取。启用开关不会开放加密 `INSERT`、`INSERT OVERWRITE`、`UPDATE`、`DELETE`、`MERGE INTO` 或维护操作。
- 加密 Iceberg v4 表、加密 ORC/Puffin 文件和其他原生加密算法不在支持范围内。
- 加密 JNI 元数据表扫描不可用，前文所述原生 `$position_deletes` 是支持的例外路径。
- 即使开启 `enable_sql_cache` 和 `enable_hive_sql_cache`，加密查询结果也不会进入 SQL 结果缓存，查询仍走物理执行。表采用加密后不能继续依赖以前的明文缓存结果。
- 一次查询成功不代表后续查询已经获得授权。后续需要受保护密钥的语句必须重新授权，共享缓存不会跳过该检查。权限撤销不会强制取消已经取得密钥的 I/O；不需要受保护密钥的语句可能不发起 KMS 请求。
- V3 规划仍为同步方式，修改外部批量扫描配置不会启用加密 V3 的 lazy SQL 执行。

## 最佳实践

- 使用专用集群 CA，并限制节点证书的签发。静态身份与信任文件需匹配 provider 配置，更换时统一协调节点。
- 保留历史快照所需 wrapping key 的访问权限，使用同一 Catalog 和热缓存验证权限撤销与恢复。
- 为 KMS 和对象存储请求规划容量。加密 COUNT、语句私有的元数据读取与明文元数据 COUNT 的成本不同。
- 为实际工作负载启用前，使用独立 data/delete 密钥的代表性数据执行原生查询。SDK 兼容模拟服务的测试与目标 KMS provider 的验收应分别完成。
