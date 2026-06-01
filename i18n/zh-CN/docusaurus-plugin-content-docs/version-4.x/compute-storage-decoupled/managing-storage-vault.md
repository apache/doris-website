---
{
    "title": "管理 Storage Vault：创建、配置与权限管理",
    "sidebar_label": "管理 Storage Vault",
    "language": "zh-CN",
    "description": "介绍如何在存算分离模式下创建、查看、修改 Storage Vault，以及为表或数据库指定存储位置，管理用户访问权限。",
    "keywords": ["Storage Vault", "存算分离", "对象存储", "HDFS", "S3", "存储管理", "Doris"]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 存算分离集群存储配置与管理 -->

Storage Vault 是 Doris 在存算分离模式中使用的远程共享存储抽象。可以配置一个或多个 Storage Vault，并将不同的表存储在不同的 Storage Vault 上，实现灵活的存储管理。

## 创建 Storage Vault

<!-- 知识类型: 操作步骤 -->

**语法**

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name>
PROPERTIES
("key" = "value", ...)
```

`<vault_name>` 是用户自定义的 Storage Vault 名称，作为后续操作的唯一标识。

### 创建 HDFS Storage Vault

<!-- 适用场景: 使用 HDFS 作为共享存储 -->

创建基于 HDFS 的 Storage Vault 前，需确保所有节点（包括 FE、BE 节点及 Meta Service）均可访问目标 HDFS，包括完成 Kerberos 授权配置和连通性检查（可在各节点上使用 Hadoop Client 测试）。

```sql
CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault_demo
PROPERTIES (
    "type"                          = "hdfs",                      -- required
    "fs.defaultFS"                  = "hdfs://127.0.0.1:8020",     -- required
    "path_prefix"                   = "big/data",                  -- optional，一般按业务名称填写
    "hadoop.username"               = "user",                      -- optional
    "hadoop.security.authentication" = "kerberos",                 -- optional
    "hadoop.kerberos.principal"     = "hadoop/127.0.0.1@XXX",     -- optional
    "hadoop.kerberos.keytab"        = "/etc/emr.keytab"            -- optional
);
```

### 创建 S3 Storage Vault

<!-- 适用场景: 使用对象存储（OSS/S3/COS 等）作为共享存储 -->

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_vault_demo
PROPERTIES (
    "type"           = "S3",                                -- required
    "s3.endpoint"    = "oss-cn-beijing.aliyuncs.com",       -- required
    "s3.region"      = "cn-beijing",                        -- required
    "s3.bucket"      = "bucket",                            -- required
    "s3.root.path"   = "big/data/prefix",                   -- required
    "s3.access_key"  = "ak",                                -- required
    "s3.secret_key"  = "sk",                                -- required
    "provider"       = "OSS",                               -- required
    "use_path_style" = "false"                              -- optional
);
```

:::caution 权限要求
对象存储路径必须具备以下访问权限：`head`、`get`、`list`、`put`、`multipartUpload`、`delete`。
:::

更多云厂商示例及参数说明，请参阅 [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT)。

## 查看 Storage Vault

<!-- 知识类型: 操作步骤 -->

**语法**

```sql
SHOW STORAGE VAULTS
```

返回结果包含 4 列：

| 列名 | 说明 |
|------|------|
| Storage Vault 名称 | 用户定义的 Vault 标识名 |
| Storage Vault ID | 系统分配的唯一 ID |
| 属性 | Vault 的配置属性 |
| 是否为默认 | 是否为默认 Storage Vault |

## 设置默认 Storage Vault

<!-- 知识类型: 操作步骤 -->

**语法**

```sql
SET <vault_name> AS DEFAULT STORAGE VAULT
```

设置后，建表时若未显式指定 Storage Vault，将自动使用该默认 Vault。

## 建表时指定 Storage Vault

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 为特定表绑定存储位置 -->

在 `CREATE TABLE` 的 `PROPERTIES` 中指定 `storage_vault_name`，表数据将存储到对应的 Storage Vault。

:::warning 注意
建表成功后，**不允许修改**该表的 `storage_vault`，即不支持更换 Storage Vault。
:::

**示例**

```sql
CREATE TABLE IF NOT EXISTS supplier (
    s_suppkey int(11)      NOT NULL COMMENT "",
    s_name    varchar(26)  NOT NULL COMMENT "",
    s_address varchar(26)  NOT NULL COMMENT "",
    s_city    varchar(11)  NOT NULL COMMENT "",
    s_nation  varchar(16)  NOT NULL COMMENT "",
    s_region  varchar(13)  NOT NULL COMMENT "",
    s_phone   varchar(16)  NOT NULL COMMENT ""
)
UNIQUE KEY (s_suppkey)
DISTRIBUTED BY HASH(s_suppkey) BUCKETS 1
PROPERTIES (
    "replication_num"    = "1",
    "storage_vault_name" = "hdfs_demo_vault"
);
```

## 创建数据库时指定 Storage Vault

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 为数据库设置默认存储位置 -->

在 `CREATE DATABASE` 的 `PROPERTIES` 中指定 `storage_vault_name`。数据库下的新建表若未单独指定 Storage Vault，将继承数据库的 Storage Vault 配置。

**示例**

```sql
CREATE DATABASE IF NOT EXISTS `db_test`
PROPERTIES (
    "storage_vault_name" = "hdfs_demo_vault"
);
```

可通过 [ALTER-DATABASE](../sql-manual/sql-statements/database/ALTER-DATABASE.md) 更改数据库的 `storage_vault_name`，**更改仅对新建表生效，不影响已有表**。

:::info 版本说明与优先级规则

- 从 **3.0.5 版本**起支持在建库时指定 Storage Vault。
- 建表时 Storage Vault 的优先级（从高到低）：**表** → **数据库** → **默认 Storage Vault**。
- 若 Storage Vault 的 `VAULT_NAME` 被修改，可能导致数据库配置的 Vault 失效并报错，需为数据库重新配置有效的 `storage_vault_name`。

:::

## 修改 Storage Vault

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 更新存储凭证或重命名 Vault -->

`ALTER STORAGE VAULT` 用于更新 Storage Vault 的可修改属性。

### 可修改属性

**S3 Storage Vault** 支持修改的属性：

| 属性 | 说明 |
|------|------|
| `VAULT_NAME` | Vault 名称（重命名） |
| `s3.access_key` | 访问密钥 ID |
| `s3.secret_key` | 访问密钥 Secret |
| `use_path_style` | 是否使用路径样式访问 |

**HDFS Storage Vault** 禁止修改的属性：

| 属性 | 原因 |
|------|------|
| `path_prefix` | 修改会导致历史数据路径不一致 |
| `fs.defaultFS` | 修改会导致无法访问已写入数据 |

更多属性说明，请参阅 [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT)。

### 示例

修改 S3 Storage Vault：

```sql
ALTER STORAGE VAULT old_s3_vault
PROPERTIES (
    "type"           = "S3",
    "VAULT_NAME"     = "new_s3_vault",
    "s3.access_key"  = "new_ak",
    "s3.secret_key"  = "new_sk"
);
```

修改 HDFS Storage Vault：

```sql
ALTER STORAGE VAULT old_hdfs_vault
PROPERTIES (
    "type"             = "hdfs",
    "VAULT_NAME"       = "new_hdfs_vault",
    "hadoop.username"  = "hdfs"
);
```

## 删除 Storage Vault

暂不支持删除 Storage Vault。

## Storage Vault 权限管理

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 多用户环境下的存储访问控制 -->

Admin 用户可向指定 MySQL 用户或角色授予 Storage Vault 的使用权限，控制哪些用户可以在建表时引用该 Vault 或查看其信息。

拥有某个 Storage Vault `USAGE_PRIV` 权限的用户/角色，可执行以下操作：

- 通过 `SHOW STORAGE VAULTS` 查看该 Storage Vault 的信息
- 建表时在 `PROPERTIES` 中指定使用该 Storage Vault

### 授予权限

**语法**

```sql
GRANT
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    TO { ROLE | USER } {<role> | <user>}
```

**示例**

```sql
GRANT USAGE_PRIV ON STORAGE VAULT my_storage_vault TO USER user1;
```

### 撤销权限

**语法**

```sql
REVOKE
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    FROM { ROLE | USER } {<role> | <user>}
```

**示例**

```sql
REVOKE USAGE_PRIV ON STORAGE VAULT my_storage_vault FROM USER user1;
```

## 常见问题

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 日常运维与故障排查 -->

### Q1：如何查询某个 Storage Vault 被哪些表引用？

**步骤一**：通过 `SHOW STORAGE VAULTS` 查看目标 Storage Vault 对应的 `storage_vault_id`。

**步骤二**：执行以下 SQL 查询引用该 Vault 的表，将 `PROPERTY_VALUE=3` 替换为实际的 `storage_vault_id` 值：

```sql
SELECT *
FROM information_schema.table_properties
WHERE PROPERTY_NAME = "storage_vault_id"
  AND PROPERTY_VALUE = 3;
```

查询结果示例：

```
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
| TABLE_CATALOG | TABLE_SCHEMA                    | TABLE_NAME                          | PROPERTY_NAME    | PROPERTY_VALUE |
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
| internal      | regression_test_vault_p0_create | s3_92ba28c209154d968e680e58dd54d0cc | storage_vault_id | 3              |
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
1 row in set (0.04 sec)
```

### Q2：建表后能否更换 Storage Vault？

不支持。建表成功后，该表的 `storage_vault` 属性不可修改。如需使用不同的 Storage Vault，需要重新建表并导入数据。

### Q3：修改 Storage Vault 名称后，原来引用该 Vault 的数据库会受影响吗？

会受影响。若 Storage Vault 的 `VAULT_NAME` 被修改，数据库级别的 `storage_vault_name` 配置可能失效，导致在该数据库下新建表时报错。需要通过 [ALTER-DATABASE](../sql-manual/sql-statements/database/ALTER-DATABASE.md) 重新为数据库指定有效的 `storage_vault_name`。
