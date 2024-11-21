---
{
    "title": "管理 Storage Vault",
    "language": "zh-CN"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

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

创建基于 HDFS 的存算分离模式 Doris 集群，需要确保所有的节点（包括 FE / BE 节点、Meta Service) 均有权限访问所指定的 HDFS，包括提前完成机器的 Kerberos 授权配置和连通性检查（可在对应的每个节点上使用 Hadoop Client 进行测试）等。

```sql
CREATE STORAGE VAULT IF NOT EXISTS ssb_hdfs_vault
    PROPERTIES (
        "type"="hdfs",                                     -- required
        "fs.defaultFS"="hdfs://127.0.0.1:8020",            -- required
        "path_prefix"="big/data",                          -- optional,  一般按照业务名称填写
        "hadoop.username"="user"                           -- optional
        "hadoop.security.authentication"="kerberos"        -- optional
        "hadoop.kerberos.principal"="hadoop/127.0.0.1@XXX" -- optional
        "hadoop.kerberos.keytab"="/etc/emr.keytab"         -- optional
    );
```

### 创建 S3  Storage Vault

```SQL
CREATE STORAGE VAULT IF NOT EXISTS ssb_s3_vault
    PROPERTIES (
        "type"="S3",                                   -- required
        "s3.endpoint" = "oss-cn-beijing.aliyuncs.com", -- required
        "s3.region" = "bj",                            -- required
        "s3.bucket" = "bucket",                        -- required
        "s3.root.path" = "big/data/prefix",            -- required
        "s3.access_key" = "ak",                        -- required
        "s3.secret_key" = "sk",                        -- required
        "provider" = "OSS"                             -- required
    );
```

更多参数说明及示例可见 [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-STORAGE-VAULT.md)。

## 查看 Storage Vault 

**语法**

```sql
SHOW STORAGE VAULTS
```

返回结果包含 4 列，分别为 Storage Vault 名称、 Storage Vault  ID、属性以及是否为默认 Storage Vault 。

### 设置默认 Storage Vault 

**语法**

```sql
SET <vault_name> AS DEFAULT STORAGE VAULT
```

## 建表时指定 Storage Vault 

建表时在 `PROPERTIES` 中指定 `storage_vault_name`，则数据会存储在指定 `vault name` 所对应的 Storage Vault 上。建表成功后，该表不允许再修改 `storage_vault`，即不支持更换 Storage Vault 。

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
"storage_vault_name" = "ssb_hdfs_vault"
);
```

## 更改 Storage Vault 

用于更新 Storage Vault 配置的可修改属性。

S3 Storage Vault 允许修改的属性:
- `VAULT_NAME`
- `s3.access_key`
- `s3.secret_key`
- `use_path_style`

HDFS Storage Vault 禁止修改的属性:
- `path_prefix`
- `fs.defaultFS`

更多属性说明见 [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-STORAGE-VAULT.md)。

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

- 通过 `SHOW STORAGE VAULT` 查看该 Storage Vault 的信息；
- 建表时在 `PROPERTIES` 中指定使用该 Storage Vault 。

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
