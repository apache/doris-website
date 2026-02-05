---
{
    "title": "管理 Storage Vault",
    "language": "zh-CN",
    "description": "Storage Vault 是 Doris 在存算分离模式中所使用的远程共享存储，可配置一个或多个 Storage Vault，可将不同表存储在不同 Storage Vault 上。"
}
---

Storage Vault 是 Doris 在存算分离模式中所使用的远程共享存储，可配置一个或多个 Storage Vault，可将不同表存储在不同 Storage Vault 上。

## 创建 Storage Vault

**语法**

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name>
PROPERTIES
("key" = "value",...)
```

<vault_name> 是用户定义的 Storage Vault 名称，是用户接口用于访问 Storage Vault 的标识。

### 创建 HDFS  Storage Vault

创建基于 HDFS 的存算分离模式 Doris 集群，需要确保所有的节点 (包括 FE / BE 节点、Meta Service) 均有权限访问所指定的 HDFS，包括提前完成机器的 Kerberos 授权配置和连通性检查（可在对应的每个节点上使用 Hadoop Client 进行测试）等。

```sql
CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault_demo
PROPERTIES (
    "type" = "hdfs",                                     -- required
    "fs.defaultFS" = "hdfs://127.0.0.1:8020",            -- required
    "path_prefix" = "big/data",                          -- optional,  一般按照业务名称填写
    "hadoop.username" = "user"                           -- optional
    "hadoop.security.authentication" = "kerberos"        -- optional
    "hadoop.kerberos.principal" = "hadoop/127.0.0.1@XXX" -- optional
    "hadoop.kerberos.keytab" = "/etc/emr.keytab"         -- optional
);
```

### 创建 S3  Storage Vault

```SQL
CREATE STORAGE VAULT IF NOT EXISTS s3_vault_demo
PROPERTIES (
    "type" = "S3",                                 -- required
    "s3.endpoint" = "oss-cn-beijing.aliyuncs.com", -- required
    "s3.region" = "cn-beijing",                    -- required
    "s3.bucket" = "bucket",                        -- required
    "s3.root.path" = "big/data/prefix",            -- required
    "s3.access_key" = "ak",                        -- required
    "s3.secret_key" = "sk",                        -- required
    "provider" = "OSS",                            -- required
    "use_path_style" = "false"                     -- optional
);
```

更多云厂商示例和参数说明可见 [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT)。

**注意**
提供的对象存储路径必须具有head/get/list/put/multipartUpload/delete访问权限。

## 查看 Storage Vault 

**语法**

```sql
SHOW STORAGE VAULTS
```

返回结果包含 4 列，分别为 Storage Vault 名称、Storage Vault  ID、属性以及是否为默认 Storage Vault。

### 设置默认 Storage Vault 

**语法**

```sql
SET <vault_name> AS DEFAULT STORAGE VAULT
```

## 建表时指定 Storage Vault 

建表时在 `PROPERTIES` 中指定 `storage_vault_name`，则数据会存储在指定 `vault name` 所对应的 Storage Vault 上。建表成功后，该表不允许再修改 `storage_vault`，即不支持更换 Storage Vault。

**示例**

```sql
CREATE TABLE IF NOT EXISTS supplier (
  s_suppkey int(11) NOT NULL COMMENT "",
  s_name varchar(26) NOT NULL COMMENT "",
  s_address varchar(26) NOT NULL COMMENT "",
  s_city varchar(11) NOT NULL COMMENT "",
  s_nation varchar(16) NOT NULL COMMENT "",
  s_region varchar(13) NOT NULL COMMENT "",
  s_phone varchar(16) NOT NULL COMMENT ""
)
UNIQUE KEY (s_suppkey)
DISTRIBUTED BY HASH(s_suppkey) BUCKETS 1
PROPERTIES (
  "replication_num" = "1",
  "storage_vault_name" = "hdfs_demo_vault"
);
```

## 创建数据库时指定 Storage Vault 

创建数据库时在 `PROPERTIES` 中指定 `storage_vault_name`。如果在数据库下建表时没有指定 `storage_vault_name`，则表会使用数据库的 `vault name` 对应的 Storage Vault 进行数据的存储。用户可以通过 [ALTER-DATABASE](../sql-manual/sql-statements/database/ALTER-DATABASE.md) 更改数据库的 `storage_vault_name`，该行为不会改变数据库下已经创建表的`storage_vault`，只有新创建的表会使用更改后的`storage_vault`。

**示例**

```sql
CREATE DATABASE IF NOT EXIST `db_test`
PROPERTIES (
    "storage_vault_name" = "hdfs_demo_vault"
);
```

:::info 备注

从 3.0.5 版本支持创建库时指定 Storage Vault。

创建表时使用 Storage Vault 的优先顺序为 表 -> 数据库 -> 默认 Storage Vault。即如果表的 PROPERTY 中没有指定 Storage Vault，则会搜索数据库是否指定了 Storage Vault；如果数据库也没有指定，则会继续搜索是否有默认 Storage Vault。

如果 Storage Vault 的 `VAULT_NAME` 属性被修改，可能会导致数据库下设置的 Storage Vault 失效而报错，用户需要根据实际情况为数据库再配置一个可用的 `storage_vault_name`。

:::


## 更改 Storage Vault 

用于更新 Storage Vault 配置的可修改属性。

S3 Storage Vault 允许修改的属性：
- `VAULT_NAME`
- `s3.access_key`
- `s3.secret_key`
- `use_path_style`

HDFS Storage Vault 禁止修改的属性：
- `path_prefix`
- `fs.defaultFS`

更多属性说明见 [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT)。

**示例**

```sql
ALTER STORAGE VAULT old_s3_vault
PROPERTIES (
    "type" = "S3",
    "VAULT_NAME" = "new_s3_vault",
    "s3.access_key" = "new_ak"
    "s3.secret_key" = "new_sk"
);
```

```sql
ALTER STORAGE VAULT old_hdfs_vault
PROPERTIES (
    "type" = "hdfs",
    "VAULT_NAME" = "new_hdfs_vault",
    "hadoop.username" = "hdfs"
);
```

## 删除 Storage Vault 

暂不支持

##  Storage Vault 权限

向指定的 MySQL 用户授予某个 Storage Vault 的使用权限，使该用户可以进行建表时指定该 Storage Vault 或查看 Storage Vault 等操作。

### 授予

```sql
GRANT
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    TO { ROLE | USER } {<role> | <user>}
```

仅 Admin 用户有权限执行 `GRANT` 语句，该语句用于向 User / Role 授予指定 Storage Vault 的权限。拥有某个 Storage Vault 的 `USAGE_PRIV` 权限的 User / Role 可进行以下操作：

- 通过 `SHOW STORAGE VAULTS` 查看该 Storage Vault 的信息；
- 建表时在 `PROPERTIES` 中指定使用该 Storage Vault。

### 撤销

```sql
grant usage_priv on storage vault my_storage_vault to user1
```

撤销指定的 MySQL 用户的 Storage Vault 权限。

**语法**

```sql
REVOKE 
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    FROM { ROLE | USER } {<role> | <user>}
```

仅 Admin 用户有权限执行 `REVOKE` 语句，用于撤销 User / Role 拥有的对指定 Storage Vault 的权限。

**示例**

```sql
revoke usage_priv on storage vault my_storage_vault from user1
```

## FAQ

#### Q1. 如何查询特定storage vault被那些表引用？

1. 通过`show storage vault`查看storage vault name对应的storage vault id

2. 执行如下sql语句:

```sql
mysql> select * from information_schema.table_properties where PROPERTY_NAME = "storage_vault_id" and PROPERTY_VALUE=3;
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
| TABLE_CATALOG | TABLE_SCHEMA                    | TABLE_NAME                          | PROPERTY_NAME    | PROPERTY_VALUE |
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
| internal      | regression_test_vault_p0_create | s3_92ba28c209154d968e680e58dd54d0cc | storage_vault_id | 3              |
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
1 row in set (0.04 sec)
```

其中`PROPERTY_VALUE=3`替换为对应`storage vault id`的数值