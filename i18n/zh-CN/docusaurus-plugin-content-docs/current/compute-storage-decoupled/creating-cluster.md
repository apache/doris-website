---
{
    "title": "创建集群",
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

本文档中，创建存算分离集群指的是在存算分离模式下，创建由多个 Doris 节点组成的分布式系统，包含 FE 和 BE 节点。随后，在存算分离模式的 Doris 集群下可创建计算集群，即创建由一个或多个 BE 节点组成的计算资源组。

一套 FoundationDB + Meta Service + Recycler 基础环境可以支撑多个存算分离集群，一个存算分离集群又称为一个数仓实例（Instance）。

存算分离架构下，数仓实例的节点构成信息由 Meta Service 维护（注册 + 变更）。FE、BE 和 Meta Service 交互以实现服务发现和身份验证。

创建存算分离集群主要涉及与 Meta Service 的交互，Meta Service 提供了标准的 [HTTP 接口](./meta-service-api.md)进行资源管理操作。

Doris 存算分离模式采用服务发现的机制进行工作，创建存算分离集群可以归纳为以下步骤：

1. 注册声明数仓实例以及它的存储后端。
2. 注册声明数仓实例中的 FE 和 BE 节点组成，分别包含哪些机器，以及如何组成集群。
3. 配置并启动所有的 FE 和 BE 节点。

:::info 备注

1. **本文后续示例中提及的** **`127.0.0.1:5000`** **指的是 Meta Service 的地址，实际操作时请替换为真实的 Meta Service IP 地址和 bRPC 监听端口。**
2. 请结合实际需求修改本文档中的示例。

:::

## 创建存算分离集群及其存储后端

这一步骤的主要目的是在 Meta Service 注册一个存算分离模式的 Doris 数仓实例（一套 Meta Service 可支持多个不同的 Doris 数仓实例（即多套 FE-BE），
包括描述该数仓实例所需的存储后端（Storage Vault，即[概览](./overview.md)中所提及的共享存储层），
可以选择 HDFS 或者 S3（包括支持 S3 协议的对象存储，如 AWS S3、GCS、Azure Blob、阿里云 OSS 以及 MinIO、Ceph 等）。
存储后端是 Doris 在存算分离模式中所使用的远程共享存储，可配置一个或多个存储后端，可将不同表存储在不同存储后端上。

此步骤需要调用 Meta Service 的 `create_instance` 接口，主要参数包括：

- `instance_id`：存算分离架构下数仓实例的 ID，一般使用 UUID 字符串，需要匹配模式`[0-9a-zA-Z_-]+`，例如 6ADDF03D-4C71-4F43-9D84-5FC89B3514F8。本文档中为了简化使用普通字符串。
- `name`：数仓实例名称，根据实际需求填写。要求匹配模式 `[a-zA-Z][0-9a-zA-Z_]+`，一般填写业务名称。
- `user_id`：创建数仓实例的用户 ID，要求匹配模式 `[a-zA-Z][0-9a-zA-Z_]+`，用于标识创建人，按需填写。
- `vault`：HDFS 或者 S3 的存储后端信息，如 HDFS 属性、S3 Bucket 信息等。不同后端的详细参数不同。

更多信息请参考 [Meta Service API 参考文档](./meta-service-api.md) “创建存储后端的 Instance” 章节。

**通过多次调用 Meta Service `create_instance` 接口可以创建多个不同的存算分离集群（即数仓实例/instance）。**

### 创建基于 HDFS 的存算分离模式 Doris 集群

创建基于 HDFS 的存算分离模式 Doris 集群，需要正确描述所有信息，并保证所有的节点（包括 FE / BE 节点、Meta Service 和 Recycler) 均有权限访问所指定的 HDFS，包括提前完成机器的 Kerberos 授权配置和连通性检查（可在对应的每个节点上使用 Hadoop Client 进行测试）等。

| 参数名                                   | 描述                          | 是否必须 | 备注                                             |
| ---------------------------------------- | ----------------------------- | -------- | ------------------------------------------------ |
| instance_id                              | instance_id                   | 是       | 全局唯一（包括历史上），一般使用一个 UUID 字符串 |
| name                                     | Instance 别名, 要求匹配模式 `[a-zA-Z][0-9a-zA-Z_]+`  | 否       |     |
| user_id                                  | 创建 Instance 的用户 ID 要求匹配模式 `[a-zA-Z][0-9a-zA-Z_]+` | 是       |  |
| vault                                    | Storage Vault 的信息          | 是       |                                                  |
| vault.hdfs_info                          | 描述 HDFS 存储后端的信息      | 是       |                                                  |
| vault.build_conf                         | 描述 HDFS 存储后端主要信息    | 是       |                                                  |
| vault.build_conf.fs_name                 | HDFS 的名称，一般为连接的地址 | 是       |                                                  |
| vault.build_conf.user                    | 连接该 HDFS 使用的 User       | 是       |                                                  |
| vault.build_conf.hdfs_kerberos_keytab    | Kerberos Keytab 的路径        | 否       | 使用 Kerberos 鉴权时需要提供                     |
| vault.build_conf.hdfs_kerberos_principal | Kerberos Principal 的信息     | 否       | 使用 Kerberos 鉴权时需要提供                     |
| vault.build_conf.hdfs_confs              | HDFS 的其他描述属性           | 否       | 按需填写                                         |
| vault.prefix                             | 数据存放的路径前缀，用于数据隔离 | 是    | 一般按照业务名称 例：`big_data`          |

**示例**

```Bash
curl -s "127.0.0.1:5000/MetaService/http/create_instance?token=greedisgood9999" -d \
'{
  "instance_id": "sample_instance_id",
  "name": "sample_instance_name",
  "user_id": "sample_user_id",
  "vault": {
    "hdfs_info" : {
      "build_conf": {
        "fs_name": "hdfs://172.21.0.44:4007",
        "user": "hadoop",
        "hdfs_kerberos_keytab": "/etc/emr.keytab",
        "hdfs_kerberos_principal": "hadoop/172.30.0.178@EMR-XXXYYY",
        "hdfs_confs" : [
          {
            "key": "hadoop.security.authentication",
            "value": "kerberos"
          }
        ]
      },
      "prefix": "sample_prefix"
    }
  }
}'
```

### 创建基于 S3 的存算分离模式 Doris 集群

基于对象存储的所有属性均为必填项，其中：

- 使用 MinIO 等支持 S3 协议的对象存储时，需要自行测试连通性以及 AK / SK 的正确性。具体做法可参考[使用 AWS CLI 验证 MinIO 是否工作](https://min.io/docs/minio/linux/integrations/aws-cli-with-minio.html)。
- Bucket 字段的值为 Bucket 名称，不包含 `s3://` 等 schema。
- `external_endpoint` 保持与 `endpoint` 值相同即可。
- 如果使用非云厂商对象存储，region 和 provider 可填写任意值。

| 参数名                     | 描述                                                         | 是否必须 | 备注                                                         |
| -------------------------- | ------------------------------------------------------------ | -------- | ------------------------------------------------------------ |
| instance_id     | 存算分离架构下数仓实例的 ID，一般使用 UUID 字符串，需要匹配模式`[0-9a-zA-Z_-]+`          | 是     |  例如 6ADDF03D-4C71-4F43-9D84-5FC89B3514F8 |
| name                                     | Instance 别名, 要求匹配模式 `[a-zA-Z][0-9a-zA-Z_]+`  | 否       |     |
| user_id                                  | 创建 Instance 的用户 ID 要求匹配模式 `[a-zA-Z][0-9a-zA-Z_]+` | 是       |  |
| vault.obj_info             | 对象存储配置信息                                             | 是       |                                                              |
| vault.obj_info.ak          | 对象存储的 Access Key                                             | 是       |                                                              |
| vault.obj_info.sk          | 对象存储的 Secret Key                                             | 是       |                                                              |
| vault.obj_info.bucket      | 对象存储的 Bucket 名                                              | 是       |                                                              |
| vault.obj_info.prefix      | 对象存储上数据存放位置前缀                                        | 否       | 若不填写该参数，则默认存放位置在 Bucket 的根目录，例：big_data |
| obj_info.endpoint          | 对象存储的 Endpoint 信息                                          | 是       | 值为 域名或 IP:端口，不包含 `http://` 等 scheme 前缀              |
| obj_info.region            | 对象存储的 Region 信息                                            | 是       | 若使用 MinIO，该参数可填任意值                               |
| obj_info.external_endpoint | 对象存储的 External Endpoint 信息                                 | 是       | 一般与 Endpoint 一致即可，兼容 OSS，注意 OSS 有 External 和 Internal 之分 |
| vault.obj_info.provider    | 对象存储的 Provider 信息，可选值包括：OSS, S3, COS, OBS, BOS, GCP, AZURE | 是       | 若使用 MinIO，直接填 S3 即可                                 |

**示例（腾讯云 COS）**

```Shell
curl -s "127.0.0.1:5000/MetaService/http/create_instance?token=greedisgood9999" -d \
'{
  "instance_id": "sample_instance_id",
  "name": "sample_instance_name",
  "user_id": "sample_user_id",
  "vault": {
    "obj_info": {
      "ak": "ak_xxxxxxxxxxx",
      "sk": "sk_xxxxxxxxxxx",
      "bucket": "sample_bucket_name",
      "prefix": "sample_prefix",
      "endpoint": "cos.ap-beijing.myqcloud.com",
      "external_endpoint": "cos.ap-beijing.myqcloud.com",
      "region": "ap-beijing",
      "provider": "COS"
    }
  }
}'
```

**示例（AWS S3）**

```Shell
curl -s "127.0.0.1:5000/MetaService/http/create_instance?token=greedisgood9999" -d \
'{
  "instance_id": "sample_instance_id",
  "name": "sample_instance_name",
  "user_id": "sample_user_id",
  "vault": {
    "obj_info": {
      "ak": "ak_xxxxxxxxxxx",
      "sk": "sk_xxxxxxxxxxx",
      "bucket": "sample_bucket_name",
      "prefix": "sample_prefix",
      "endpoint": "s3.amazonaws.com",
      "external_endpoint": "s3.amazonaws.com",
      "region": "us-east1",
      "provider": "AWS"
    }
  }
}'
```

## 操作存储后端

用户可配置一个或多个存储后端，或将不同表存储在不同存储后端上。

### **名词解释**

- `vault name`：每个存储后端的名称为数仓实例内全局唯一，除 `built-in vault` 外，`vault name` 由用户创建存储后端时指定。
- `built-in vault`：存算分离模式下，用于存储 Doris 系统表的远程共享存储。须在创建数仓实例时配置。`built-in vault` 的固定名称为 `built_in_storage_vault`。配置 `built-in vault`后，数仓实例（FE）才能启动。
- `default vault`：数仓实例级别的默认存储后端，用户可以指定某个存储后端为默认存储后端，包括 `built-in vault` 也可作为默认存储后端。由于存算分离模式中，数据必须要存储在某个远程共享存储上，因此如果用户建表时未在 `PROPERTIES` 中指定 `vault_name`，该表数据会存储在 `default vault` 上。`default vault` 可被重新设置，但是已经创建的表所使用的存储后端不会随之改变。

配置 `built-in vault` 后，还可按需创建更多存储后端。FE 启动成功后，可通过 SQL 语句进行存储后端操作，包括创建存储后端，查看存储后端以及指定存储后端进行建表等。

### 创建存储后端

**语法**

```SQL
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name>
PROPERTIES
("key" = "value",...)
```

<vault_name> 是用户定义的存储后端名称，是用户接口用于访问存储后端的标识。

**示例**

**创建 HDFS 存储后端**

```SQL
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

**创建 S3 存储后端**

```SQL
CREATE STORAGE VAULT IF NOT EXISTS ssb_s3_vault
    PROPERTIES (
        "type"="S3",                                            -- required
        "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",          -- required
        "s3.external_endpoint" = "oss-cn-beijing.aliyuncs.com", -- required
        "s3.bucket" = "sample_bucket_name",                     -- required
        "s3.region" = "bj",                                     -- required
        "s3.root.path" = "big/data/prefix",                     -- required
        "s3.access_key" = "ak",                                 -- required
        "s3.secret_key" = "sk",                                 -- required
        "provider" = "cos",                                     -- required
    );
```

:::info 备注

新创建的存储后端对 BE 集群不一定实时可见，短时间（< 1min）内向使用新创建存储后端的表导入数据发生报错是正常现象。

:::

**Properties 参数**

| 参数                          | 说明                                                                               | 是否必须  | 示例                           |
| ------------------------------| -------------------                                                                | ------    | -------------------------------|
| type                          | 目前支持 S3 和 HDFS                                                                | 是        | `s3` 或 `hdfs`    |
| fs.defaultFS                  | HDFS Vault 参数                                                                    | 是        | `hdfs://127.0.0.1:8020`        |
| path_prefix                   | HDFS Vault 参数，数据存储的路径前缀，一般按照业务名称区分                          | 否        | `big/data/dir`                |
| hadoop.username               | HDFS Vault 参数                                                                    | 否        | `hadoop`                       |
| hadoop.security.authentication| HDFS Vault 参数                                                                    | 否        | `kerberos`                     |
| hadoop.kerberos.principal     | HDFS Vault 参数                                                                    | 否        | `hadoop/127.0.0.1@XXX`         |
| hadoop.kerberos.keytab        | HDFS Vault 参数                                                                    | 否        | `/etc/emr.keytab`              |
| dfs.client.socket-timeout     | HDFS Vault 参数，单位毫秒                                                         | 否        | `60000`                        |
| s3.endpiont                   | S3 Vault 参数                                                                      | 是        | `oss-cn-beijing.aliyuncs.com`  |
| s3.external_endpoint          | S3 vault 参数                                                                      | 是          | `oss-cn-beijing.aliyuncs.com` |
| s3.bucket                     | S3 vault 参数                                                                      | 是          | `sample_bucket_name`          |
| s3.region                     | S3 Vault 参数                                                                      | 是        | `bj`                           |
| s3.root.path                  | S3 Vault 参数，实际存储数据的路径前缀                                              | 是        | `/big/data/prefix`             |
| s3.access_key                 | S3 Vault 参数                                                                     | 是        |                                |
| s3.secret_key                 | S3 Vault 参数                                                                     | 是        |                                |
| provider                      | S3 Vault 参数，目前支持腾讯 COS，阿里 OSS，AWS S3，微软 AZURE，百度 BOS，华为 OBS，谷歌 GCP；若使用 MinIO，直接填写 S3 即可 | 是        | `cos`                          |

### 查看存储后端

**语法**

```Plain
SHOW STORAGE VAULT
```

返回结果包含 4 列，分别为存储后端名称、存储后端 ID、属性以及是否为默认存储后端。

**示例**

```SQL
mysql> show storage vault;
+------------------------+----------------+-------------------------------------------------------------------------------------------------------------+-----------+
| StorageVaultName       | StorageVaultId | Propeties                                                                                                   | IsDefault |
+------------------------+----------------+-------------------------------------------------------------------------------------------------------------+-----------+
| built_in_storage_vault | 1              | build_conf { fs_name: "hdfs://127.0.0.1:8020" } prefix: "_1CF80628-16CF-0A46-54EE-2C4A54AB1519"             | false     |
| hdfs_vault             | 2              | build_conf { fs_name: "hdfs://127.0.0.1:8020" } prefix: "big/data/dir_0717D76E-FF5E-27C8-D9E3-6162BC913D97" | false     |
+------------------------+----------------+-------------------------------------------------------------------------------------------------------------+-----------+
```

### 设置默认存储后端

**语法**

```SQL
SET <vault_name> AS DEFAULT STORAGE VAULT
```

### 建表时指定存储后端

建表时在 `PROPERTIES` 中指定 `storage_vault_name`，则数据会存储在指定 `vault name` 所对应的存储后端上。建表成功后，该表不允许再修改 `storage_vault`，即不支持更换存储后端。

**示例**

```SQL
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

### 内置存储后端

用户在创建实例时，可以选择 Vault Mode 或非 Vault Mode，如果选择 Vault Mode，所传入的 Vault 会被设置为 `built-in storage vault`。`built-in storage vault` 用于保存内部表信息（如统计信息表），在 Vault 模式下，如果未创建 `built-in storage vault`，FE 将无法正常启动。

用户也可以选择将自己的新表数据存储在 `built-in storage vault` 之上，可以通过将 `built-in storage vault` 设置为 `default storage vault` 或者在建表时将表的 `storage_vault_name` 属性设置为 `built-in storage vault` 实现。

### 更改存储后端

用于更新 Storage Vault 配置的可修改属性。

Coming soon

### 删除存储后端

只有非默认存储后端且没有被任何表引用的存储后端才可被删除。

Coming soon

### 存储后端权限

向指定的 MySQL 用户授予某个存储后端的使用权限，使该用户可以进行建表时指定该存储后端或查看存储后端等操作。

**语法**

```SQL
GRANT
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    TO { ROLE | USER } {<role> | <user>}
```

仅 Admin 用户有权限执行 `GRANT` 语句，该语句用于向 User / Role 授予指定存储后端的权限。拥有某个存储后端的 `USAGE_PRIV` 权限的 User / Role 可进行以下操作：

- 通过 `SHOW STORAGE VAULT` 查看该存储后端的信息；
- 建表时在 `PROPERTIES` 中指定使用该存储后端。

**示例**

```Bash
grant usage_priv on storage vault my_storage_vault to user1
```

撤销指定的 MySQL 用户的存储后端权限。

**语法**

```SQL
REVOKE 
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    FROM { ROLE | USER } {<role> | <user>}
```

仅 Admin 用户有权限执行 `REVOKE` 语句，用于撤销 User / Role 拥有的对指定存储后端的权限。

**示例**

```Bash
revoke usage_priv on storage vault my_storage_vault from user1
```

## 添加 FE

存算分离模式下，FE 以及 BE 的节点管理使用的接口相同，仅参数配置不同，
可通过 Meta Service `add_cluster` 接口进行 FE 以及 BE 的初始节点添加。

`add_cluster` 接口的参数列表如下：

| 参数名                        | 描述                    | 是否必须 | 备注                                                         |
| ----------------------------- | ----------------------- | -------- | ------------------------------------------------------------ |
| instance_id                   | instance_id，存算分离架构下数仓实例的 ID，一般使用 UUID 字符串，需要匹配模式`[0-9a-zA-Z_-]+`         | 是       | 全局唯一（包括历史上，每次调用此接口使用不一样的值）         |
| cluster                       | Cluster 对象            | 是       |                                                              |
| cluster.cluster_name          | Cluster 名称，需要匹配模式 `[a-zA-Z][0-9a-zA-Z_]+`| 是       | 其中 FE 的 Cluster 名称特殊，默认为 RESERVED_CLUSTER_NAME_FOR_SQL_SERVER，可在 fe.conf 中配置 cloud_observer_cluster_name 修改 |
| cluster.cluster_id            | Cluster 的 ID           | 是       | 其中 FE 的 Cluster ID 特殊，默认为 RESERVED_CLUSTER_ID_FOR_SQL_SERVER，可在 fe.conf 中配置 cloud_observer_cluster_id 修改 |
| cluster.type                  | Cluster 中节点的类型    | 是       | 支持："SQL","COMPUTE" 两种 Type，"SQL"表示 SQL Service 对应 FE， "COMPUTE"表示计算机节点对应 BE |
| cluster.nodes                 | Cluster 中的节点数组    | 是       |                                                              |
| cluster.nodes.cloud_unique_id | 节点的 cloud_unique_id, 格式为 `1:<instance_id>:<string>`, 其中`string`要求匹配模式 `[0-9a-zA-Z_-]+` 每个节点选用不同的值 | 是       | fe.conf、be.conf 中的 cloud_unique_id 配置项                 |
| cluster.nodes.ip              | 节点的 IP               | 是       | 使用 FQDN 模式部署 FE/BE 时，该字段填写域名                  |
| cluster.nodes.host            | 节点的域名              | 否       | 使用 FQDN 模式部署 FE/BE 时，需设置该字段                    |
| cluster.nodes.heartbeat_port  | BE 的 Heartbeat Port    | BE 必填  | be.conf 中的 heartbeat_service_port 配置项                   |
| cluster.nodes.edit_log_port   | FE 节点的 Edit Log Port | FE 必填  | 是 fe.conf 中的 edit_log_port 配置项                         |
| cluster.nodes.node_type       | FE 节点的类型           | FE 必填  | 当 Cluster 的 Type 为 SQL 时，需要填写，分为"FE_MASTER" 和 "FE_OBSERVER"，其中 "FE_MASTER" 表示此节点为 Master， "FE_OBSERVER" 表示此节点为 Observer，注意：一个 Type 为 "SQL" 的 Cluster 的 Nodes 数组中只能有一个 "FE_MASTER" 节点，和若干 "FE_OBSERVER" 节点 |


以下为添加一个 FE 的示例：

```Bash
# 添加 FE
curl '127.0.0.1:5000/MetaService/http/add_cluster?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cluster":{
        "type":"SQL",
        "cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
        "cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER",
        "nodes":[
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_sql_server00",
                "ip":"172.21.16.21",
                "edit_log_port":12103,
                "node_type":"FE_MASTER"
            }
        ]
    }
}'

# 创建成功后，可以通过 get_cluster 返回值 进行确认
curl '127.0.0.1:5000/MetaService/http/get_cluster?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_sql_server00",
    "cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
    "cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER"
}'
```

上述接口中如果需在初始操作即添加 2 个 FE，可在 `nodes` 数组增加一个声明节点。
如下为增加一个 `observer` 的例子：

```
...
        "nodes":[
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_sql_server00",
                "ip":"172.21.16.21",
                "edit_log_port":12103,
                "node_type":"FE_MASTER"
            },
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_sql_server00",
                "ip":"172.21.16.22",
                "edit_log_port":12103,
                "node_type":"FE_OBSERVER"
            }
        ]
...
```
如果需要增加或者减少 FE 节点，可以参考后续 “计算集群操作” 章节。

## 创建计算集群

用户可创建一个或多个计算集群，一个计算集群由任意多个 BE 节点组成。
创建计算集群操作也可通过 Meta Service `add_cluter` 接口进行。

接口描述详见前文 “添加 FE” 章节。

用户可根据实际需求调整计算集群的数量及其所包含的节点数量，不同的计算集群需要使用不同的 `cluster_name` 和 `cluster_id`。

如下是创建包含 1 个 BE 的 计算集群：

```Bash
# 172.19.0.11
# 添加 BE
curl '127.0.0.1:5000/MetaService/http/add_cluster?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cluster":{
        "type":"COMPUTE",
        "cluster_name":"cluster_name0",
        "cluster_id":"cluster_id0",
        "nodes":[
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node0",
                "ip":"172.21.16.21",
                "heartbeat_port":9455
            }
        ]
    }
}'

# 创建成功后，通过 get_cluster 进行确认
curl '127.0.0.1:5000/MetaService/http/get_cluster?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node0",
    "cluster_name":"cluster_name0",
    "cluster_id":"cluster_id0"
}'
```

上述接口中如果需在初始操作就添加 2 个 BE，可在 `nodes` 数组增加一个声明节点。
如下为声明一个包含 2 个 BE 的计算集群的例子：

```
...
        "nodes":[
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node0",
                "ip":"172.21.16.21",
                "heartbeat_port":9455
            },
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node0",
                "ip":"172.21.16.22",
                "heartbeat_port":9455
            }
        ]
...
```
如果需要增加或减少 BE 节点，可以参考后续 “计算集群操作” 章节。
如果需要继续增加计算集群，重复本章节操作即可。

## FE/BE 配置

相较于[存算一体模式](../cluster-deployment/standard-deployment.md)，存算分离模式下的 FE 和 BE 增加了部分配置，其中：

- `meta_service_endpoint`：Meta Service 的地址，需在 FE 和 BE 中填写。
- `cloud_unique_id`：根据创建存算分离集群发往 Meta Service `add_cluster` 请求中的实际值填写即可；Doris 通过该配置的值确定是否在存算分离模式下工作。

### fe.conf

```Shell
meta_service_endpoint = 127.0.0.1:5000
cloud_unique_id = 1:sample_instance_id:cloud_unique_id_sql_server00
```

### be.conf

下述示例中， `meta_service_use_load_balancer` 和 `enable_file_cache` 均可复制，其他配置项需根据实际情况填写。

`file_cache_path` 是一个 JSON 数组（根据实际缓存盘的个数配置），其各个字段含义如下：

- `path`：缓存数据存放路径，类似于存算一体模式下的 `storage_root_path`
- `total_size`：期望使用的缓存空间上限
- `query_limit`：单个查询在缓存未命中时最多可淘汰的缓存数据量（为了防止大查询将缓存全部淘汰）；因缓存需要存放数据，所以最好使用 SSD 等高性能磁盘作为缓存存储介质。

```Shell
meta_service_endpoint = 127.0.0.1:5000
cloud_unique_id = 1:sample_instance_id:cloud_unique_id_compute_node0
meta_service_use_load_balancer = false
enable_file_cache = true
file_cache_path = [{"path":"/mnt/disk1/doris_cloud/file_cache","total_size":104857600000,"query_limit":10485760000}, {"path":"/mnt/disk2/doris_cloud/file_cache","total_size":104857600000,"query_limit":10485760000}]
```

## 启停 FE/BE

Doris 存算分离模式下，FE/BE 启停方式和[存算一体模式](../cluster-deployment/standard-deployment.md)下的启停方式一致。
**存算分离模式属于服务发现的模式，不需通过 `alter system add/drop frontend/backend` 等命令操作节点。**

```Shell
bin/start_be.sh --daemon
bin/stop_be.sh

bin/start_fe.sh --daemon
bin/stop_fe.sh
```

启动后观察日志，如果上述配置均正确，则说明已进入正常工作模式，可通过 MySQL 客户端连接 FE 进行访问。

## 计算集群操作

### 加减 FE/BE 节点

加减节点的操作和与创建计算集群的步骤类似，即向 Meta Service 声明需要增加的节点，然后启动对应的节点即可（请注意确保新增节点的配置正确），不需要使用 `alter system add / drop` 语句进行额外操作。

存算分离模式下，可以同时增加/减少若干个节点，然而，建议实际操作时每次只操作一个节点。

**示例**

为计算集群 `cluster_name0` 增加两个 BE 节点。

```Plain
curl '127.0.0.1:5000/MetaService/http/add_node?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cluster":{
        "type":"COMPUTE",
        "cluster_name":"cluster_name0",
        "cluster_id":"cluster_id0",
        "nodes":[
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node1",
                "ip":"172.21.16.22",
                "heartbeat_port":9455
            },
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node2",
                "ip":"172.21.16.23",
                "heartbeat_port":9455
            }
        ]
    }
}'
```

为计算集群 `cluster_name0` 减少两个 BE 节点

```Plain
curl '127.0.0.1:5000/MetaService/http/drop_node?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cluster":{
        "type":"COMPUTE",
        "cluster_name":"cluster_name0",
        "cluster_id":"cluster_id0",
        "nodes":[
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node1",
                "ip":"172.21.16.22",
                "heartbeat_port":9455
            },
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node2",
                "ip":"172.21.16.23",
                "heartbeat_port":9455
            }
        ]
    }
}'
```

增加一个 FE Observer，以下示例中，`node_type` 为 `FE_OBSERVER`。

**目前尚不支持添加 FE Follower 角色。**

```Plain
curl '127.0.0.1:5000/MetaService/http/add_node?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cluster":{
        "type":"SQL",
        "cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
        "cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER",
        "nodes":[
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_sql_server00",
                "ip":"172.21.16.22",
                "edit_log_port":12103,
                "node_type":"FE_OBSERVER"
            }
        ]
    }
}'
```

删除一个 FE 节点

```Plain
curl '127.0.0.1:5000/MetaService/http/drop_node?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cluster":{
        "type":"SQL",
        "cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
        "cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER",
        "nodes":[
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_sql_server00",
                "ip":"172.21.16.22",
                "edit_log_port":12103,
                "node_type":"FE_MASTER"
            }
        ]
    }
}'
```

### 加减计算集群

新增一个计算集群，参考前文创建计算集群章节即可。

删除一个计算集群，调用 Meta Service 接口之后，关停响应节点即可。

**示例**

删除名为 `cluster_name0` 的计算集群（以下所有参数均为必填项）。

```
curl '127.0.0.1:5000/MetaService/http/add_cluster?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cluster":{
        "type":"COMPUTE",
        "cluster_name":"cluster_name0",
        "cluster_id":"cluster_id0"
     }
}'
```
