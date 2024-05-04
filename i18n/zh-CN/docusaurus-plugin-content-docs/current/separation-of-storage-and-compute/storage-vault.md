---
{
    "title": "storage-vault(存储后端)",
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

## 概览

Storage Vault 是doris存算分离模式使用的远程共享存储。用户可以配置一个或者多个 Storage Vault ，不同表允许存储在不同 Storage Vault 上。

## 名词解释

vault name：每个 Storage Vault 有一个数仓实例内全局唯一的名称，除 built-in vault 外，vault name 由用户创建 Storage Vault 时指定。

built-in vault：存算分离模式用于存储 Doris 系统表的远程共享存储，必须在创建数仓实例时就配置好。built-in vault 有固定 vault name "built_in_storage_vault"。必须配置 built-in vault，数仓(FE) 才能启动。

default vault：数仓实例级别的默认 Storage Vault，用户可以指定某个 Storage Vault 为 default vault，包括 built-in vault 也可以作为 default vault。由于存算分离模式中，数据必须要存储在某个远程共享存储上，如果用户建表时没有在 table properties 中指定 vault_name，则该表数据会存储在 default vault 上。default vault 可以被重新设置，但是已经创建的表所使用的 Storage Vault 不会因此改变。

## 使用

### Create Storage Vault

创建 Storage Vault。

语法：

```SQL
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name>
PROPERTIES
("key" = "value",...)
```

<vault_name> 是用户定义的 storage vault 的名称，是用户接口用于访问 storage vault 的标识

e.g.

 创建 HDFS storage vault

```SQL
CREATE STORAGE VAULT IF NOT EXISTS ssb_hdfs_vault
    PROPERTIES (
        "type"="hdfs", -- required
        "fs.defaultFS"="hdfs://127.0.0.1:8020", -- required
        "path_prefix"="prefix", -- optional -> Gavin希望是required
        "hadoop.username"="user" -- optional
        "hadoop.security.authentication"="kerberos" -- optional
        "hadoop.kerberos.principal"="hadoop/127.0.0.1@XXX" -- optional
        "hadoop.kerberos.keytab"="/etc/emr.keytab" -- optional
    );
```

创建 s3 storage vault

```SQL
CREATE STORAGE VAULT IF NOT EXISTS ssb_hdfs_vault
    PROPERTIES (
        "type"="S3", -- required
        "s3.endpoint" = "bj", -- required
        "s3.region" = "bj", -- required
        "s3.root.path" = "/path/to/root", -- required
        "s3.access_key" = "ak", -- required
        "s3.secret_key" = "sk", -- required
        "provider" = "cos", -- required
    );
```

注意：新创建的 Storage Vault 对 BE 集群不一定能实时可见，短时间（< 1min）内向使用新 Storage Vault 的表导入数据报错是正常现象。

Properties 参数

| 参数                           | 说明                | 示例                            |
| ------------------------------ | ------------------- | ------------------------------- |
| type                           | 目前支持 s3 和 hdfs | s3 \| hdfs                      |
| fs.defaultFS                   | HDFS Vault 参数     | hdfs://127.0.0.1:8020           |
| hadoop.username                | HDFS Vault 参数     | hadoop                          |
| hadoop.security.authentication | HDFS Vault 参数     | kerberos                        |
| hadoop.kerberos.principal      | HDFS Vault 参数     | hadoop/127.0.0.1@XXX            |
| hadoop.kerberos.keytab         | HDFS Vault 参数     | /etc/emr.keytab                 |
| dfs.client.socket-timeout      | HDFS Vault 参数     | dfs.client.socket-timeout=60000 |

### Show Storage Vault

语法：

```Plain
SHOW STORAGE VAULT
```

show出来4列，一列是name 一列是id 一列是属性 一列是是否是default

```SQL
mysql> show storage vault;
+------------------------+----------------+-------------------------------------------------------------------------------------------------+-----------+
| StorageVaultName       | StorageVaultId | Propeties                                                                                       | IsDefault |
+------------------------+----------------+-------------------------------------------------------------------------------------------------+-----------+
| built_in_storage_vault | 1              | build_conf { fs_name: "hdfs://127.0.0.1:8020" } prefix: "_1CF80628-16CF-0A46-54EE-2C4A54AB1519" | false     |
| hdfs_vault             | 2              | build_conf { fs_name: "hdfs://127.0.0.1:8020" } prefix: "_0717D76E-FF5E-27C8-D9E3-6162BC913D97" | false     |
+------------------------+----------------+-------------------------------------------------------------------------------------------------+-----------+
```

### Set Default Storage Vault

语法：

```SQL
SET <vault_name> AS DEFAULT STORAGE VAULT
```

### 指定 vault name 建表

建表时在 properties 中指定 "storage_vault"，则数据会存储在指定的 vault name 对应的 Storage Vault 上。建表成功后，该表不允许再修改 storage_vault，即不支持更换 Storage Vault。

e.g.

```SQL
CREATE TABLE IF NOT EXISTS `supplier` (
  `s_suppkey` int(11) NOT NULL COMMENT "",
  `s_name` varchar(26) NOT NULL COMMENT "",
  `s_address` varchar(26) NOT NULL COMMENT "",
  `s_city` varchar(11) NOT NULL COMMENT "",
  `s_nation` varchar(16) NOT NULL COMMENT "",
  `s_region` varchar(13) NOT NULL COMMENT "",
  `s_phone` varchar(16) NOT NULL COMMENT ""
)
UNIQUE KEY (`s_suppkey`)
DISTRIBUTED BY HASH(`s_suppkey`) BUCKETS 1
PROPERTIES (
"replication_num" = "1",
"storage_vault_name" = "ssb_hdfs_vault"
);
```

### Built-in storage vault

用户在创建create instance的时候可以选择vault mode或者非vault mode，如果选择的是vault mode，传递进去的vault则会被设置为built-in storage vault. Built-in storage vault是用来保存内部表的信息的（比如统计信息表），在vault模式下如果没有创建built-in storage vault则FE是无法正常启动的。

用户也可以选择将自己的新的表的数据存储在built-in storage vault之上，可以通过将built-in storage vault设置为default storage vault或者在建表的时候将表的storage_vault_name属性设置为builtin storage vault实现.

### Alter Storage Vault

TBD

用于更新 Storage Vault 配置的可修改属性。

### Drop Storage Vault

TBD

只有不是 default vault 且没有被任何表引用的 Storage Vault 可以被 drop


### 权限

TBD
