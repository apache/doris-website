---
{
    "title": "Paimon Catalog",
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

Doris 支持通过多种元数据服务访问 Paimon 表元数据，并进行 Paimon 数据查询。

目前只支持 Paimon 表的读操作，未来会支持的写入 Paimon 表。

## 适用场景

| 场景 | 说明                 |
| ---- | ------------------------------------------------------ |
| 查询加速 | 利用 Doris 分布式计算引擎，直接访问 Paimon 数据进行查询加速。                 |
| 数据集成 | 读取 Paimon 数据并写入到 Doris 内表。或通过 Doris 计算引擎进行 ZeroETL 操作。 |
| 数据写回 | 暂不支持。                                                   |

## 配置 Catalog

### 语法

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = '<paimon_catalog_type>',
    'warehouse' = '<paimon_warehouse>'
    {MetaStoreProperties},
    {StorageProperties},
    {CommonProperties}
);
```

* `<paimon_catalog_type>`

  Paimon Catalog 的类型，支持以下几种：

  * `filesystem`：默认。直接访问文件系统上存储的元数据。

  * `hms`：使用 Hive Metastore 作为元数据服务。

  * `dlf`：使用阿里云 DLF 作为元数据服务。

* `<paimon_warehouse>`

  Paimon 的仓库路径。当 `<paimon_catalog_type>` 为 `filesystem` 时，需指定这个参数。

  `warehouse` 的路径必须指向 `Database` 路径的上一级。如您的表路径是：`s3://bucket/path/to/db1/table1`，那么 `warehouse` 应该是：`s3://bucket/path/to/`。

* `{MetaStoreProperties}`

  MetaStoreProperties 部分用于填写 Metastore 元数据服务连接和认证信息。具体可参阅【支持的元数据服务】部分。

* `{StorageProperties}`

  StorageProperties 部分用于填写存储系统相关的连接和认证信息。具体可参阅【支持的存储系统】部分。

* `{CommonProperties}`

  CommonProperties 部分用于填写通用属性。请参阅[ 数据目录概述 ](../catalog-overview.md)中【通用属性】部分。

### 支持的 Paimon 版本

当前依赖的 Paimon 版本为 0.8.1。支持读取更高版本的 Paimon 表。

### 支持的 Paimon 格式

* 支持读取 Paimon Deletion Vector

### 支持的元数据服务

* [ Hive Metastore](../metastores/hive-metastore.md)

* [ Aliyun DLF ](../metastores/aliyun-dlf.md)

* [ FileSystem](../metastores/filesystem.md)

### 支持的存储系统

* [ HDFS](../storages/hdfs.md)

* [ AWS S3](../storages/s3.md)

* [ Google Cloud Storage](../storages/gcs.md)

* [ 阿里云 OSS](../storages/aliyun-oss.md)

* [ 腾讯云 COS](../storages/tencent-cos.md)

* [ 华为云 OBS](../storages/huawei-obs.md)

* [ MINIO](../storages/minio.md)

### 支持的数据格式

* [ Parquet](../file-formats/parquet.md)

* [ ORC](../file-formats/orc.md)

## 列类型映射

| Paimon Type                        | Doris Type    | Comment                                |
| ---------------------------------- | ------------- | -------------------------------------- |
| boolean                            | boolean       |                                        |
| tinyint                            | tinyint       |                                        |
| smallint                           | smallint      |                                        |
| integer                            | int           |                                        |
| bigint                             | bigint        |                                        |
| float                              | float         |                                        |
| double                             | double        |                                        |
| decimal(P, S)                      | decimal(P, S) |                                        |
| varchar                            | string        |                                        |
| char                               | string        |                                        |
| bianry                             | string        |                                        |
| varbinary                          | string        |                                        |
| date                               | date          |                                        |
| timestamp\_without\_time\_zone     | datetime(N)   | 会根据精度进行对应映射。如果精度大于 6，则最大映射到 6。（可能导致精度丢失） |
| timestamp\_with\_local\_time\_zone | datetime(N)   | 会根据精度进行对应映射。如果精度大于 6，则最大映射到 6。（可能导致精度丢失） |
| array                              | array         |                                        |
| map                                | map           |                                        |
| row                                | struct        |                                        |
| other                              | UNSUPPORTED   |                                        |

## 基础示例

### Paimon on HDFS

```sql
CREATE CATALOG paimon_hdfs PROPERTIES (
    'type' = 'paimon',
    'warehouse' = 'hdfs://HDFS8000871/user/paimon',
    'dfs.nameservices' = 'HDFS8000871',
    'dfs.ha.namenodes.HDFS8000871' = 'nn1,nn2',
    'dfs.namenode.rpc-address.HDFS8000871.nn1' = '172.21.0.1:4007',
    'dfs.namenode.rpc-address.HDFS8000871.nn2' = '172.21.0.2:4007',
    'dfs.client.failover.proxy.provider.HDFS8000871' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
    'hadoop.username' = 'hadoop'
);
```

### Paimon on HMS

```sql
CREATE CATALOG paimon_hms PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'hms',
    'warehouse' = 'hdfs://HDFS8000871/user/zhangdong/paimon2',
    'hive.metastore.uris' = 'thrift://172.21.0.44:7004',
    'dfs.nameservices' = 'HDFS8000871',
    'dfs.ha.namenodes.HDFS8000871' = 'nn1,nn2',
    'dfs.namenode.rpc-address.HDFS8000871.nn1' = '172.21.0.1:4007',
    'dfs.namenode.rpc-address.HDFS8000871.nn2' = '172.21.0.2:4007',
    'dfs.client.failover.proxy.provider.HDFS8000871' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
    'hadoop.username' = 'hadoop'
);
```

### Paimon on DLF

```sql
CREATE CATALOG paimon_dlf PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'dlf',
    'warehouse' = 'oss://xx/yy/',
    'dlf.proxy.mode' = 'DLF_ONLY',
    'dlf.uid' = 'xxxxx',
    'dlf.region' = 'cn-beijing',
    'dlf.access_key' = 'ak',
    'dlf.secret_key' = 'sk'
);
```

## 查询操作

### 基础查询

配置好 Catalog 后，可以通过以下方式查询 Catalog 中的表数据：

```sql
-- 1. switch to catalog, use database and query
SWITCH paimon_ctl;
USE paimon_db;
SELECT * FROM paimon_tbl LIMIT 10;

-- 2. use paimon database directly
USE paimon_ctl.paimon_db;
SELECT * FROM paimon_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM paimon_ctl.paimon_db.paimon_tbl LIMIT 10;
```

## 附录

