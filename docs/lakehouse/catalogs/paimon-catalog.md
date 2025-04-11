---
{
    "title": "Paimon Catalog",
    "language": "en"
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

Doris currently supports accessing Paimon table metadata through various metadata services and querying Paimon data.

At present, only read operations on Paimon tables are supported. Write operations to Paimon tables will be supported in the future.

[Quick start with Apache Doris and Apache Paimon](../best-practices/doris-paimon.md).

## Applicable Scenarios

| Scenario     | Description                                                  |
| ------------ | ------------------------------------------------------------ |
| Query Acceleration | Use Doris's distributed computing engine to directly access Paimon data for query acceleration. |
| Data Integration   | Read Paimon data and write it into Doris internal tables, or perform ZeroETL operations using the Doris computing engine. |
| Data Write-back    | Not supported yet.                                      |

## Configuring Catalog

### Syntax

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

  The type of Paimon Catalog, supporting the following:

  * `filesystem`: Default. Directly accesses metadata stored on the file system.

  * `hms`: Uses Hive Metastore as the metadata service.

  * `dlf`: Uses Alibaba Cloud DLF as the metadata service.

* `<paimon_warehouse>`

  The warehouse path for Paimon. This parameter must be specified when `<paimon_catalog_type>` is `filesystem`.

  The `warehouse` path must point to the level above the `Database` path. For example, if your table path is: `s3://bucket/path/to/db1/table1`, then `warehouse` should be: `s3://bucket/path/to/`.

* `{MetaStoreProperties}`

  The MetaStoreProperties section is used to fill in connection and authentication information for the Metastore metadata service. Refer to the section on [Supported Metadata Services] for details.

* `{StorageProperties}`

  The StorageProperties section is used to fill in connection and authentication information related to the storage system. Refer to the section on [Supported Storage Systems] for details.

* `{CommonProperties}`

  The CommonProperties section is used to fill in common properties. Please refer to the [Catalog Overview](../catalog-overview.md) section on [Common Properties].
  
### Supported Paimon Versions

The currently dependent Paimon version is 1.0.0.

### Supported Paimon Formats

* Supports reading Paimon Deletion Vector

### Supported Metadata Services

* [Hive Metastore](../metastores/hive-metastore.md)

* [Aliyun DLF](../metastores/aliyun-dlf.md)

* [FileSystem](../metastores/filesystem.md)

### Supported Storage Systems

* [HDFS](../storages/hdfs.md)

* [AWS S3](../storages/s3.md)

* [Google Cloud Storage](../storages/gcs.md)

* [Alibaba Cloud OSS](../storages/aliyun-oss.md)

* [Tencent Cloud COS](../storages/tencent-cos.md)

* [Huawei Cloud OBS](../storages/huawei-obs.md)

* [MINIO](../storages/minio.md)

### Supported Data Formats

* [Parquet](../file-formats/parquet.md)

* [ORC](../file-formats/orc.md)

## Column Type Mapping

| Paimon Type                        | Doris Type    | Comment                                                                 |
| ---------------------------------- | ------------- | ----------------------------------------------------------------------- |
| boolean                            | boolean       |                                                                         |
| tinyint                            | tinyint       |                                                                         |
| smallint                           | smallint      |                                                                         |
| integer                            | int           |                                                                         |
| bigint                             | bigint        |                                                                         |
| float                              | float         |                                                                         |
| double                             | double        |                                                                         |
| decimal(P, S)                      | decimal(P, S) |                                                                         |
| varchar                            | string        |                                                                         |
| char                               | string        |                                                                         |
| binary                             | string        |                                                                         |
| varbinary                          | string        |                                                                         |
| date                               | date          |                                                                         |
| timestamp\_without\_time\_zone     | datetime(N)   | Mapped according to precision. If precision is greater than 6, it maps to a maximum of 6 (may cause precision loss). |
| timestamp\_with\_local\_time\_zone | datetime(N)   | Mapped according to precision. If precision is greater than 6, it maps to a maximum of 6 (may cause precision loss). |
| array                              | array         |                                                                         |
| map                                | map           |                                                                         |
| row                                | struct        |                                                                         |
| other                              | UNSUPPORTED   |                                                                         |

## Examples

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

### Paimon on Google Dataproc Metastore

```sql
CREATE CATALOG `paimon_gms` PROPERTIES (
    "type" = "paimon",
    "paimon.catalog.type" = "hms",
    "hive.metastore.uris" = "thrift://ip:port",
    "warehouse" = "gs://bucket/warehouse",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.region" = "region",
    "s3.endpoint" = "storage.googleapis.com"
);
```

### Paimon on Google Cloud Storage

```sql
CREATE CATALOG `paimon_gcs` PROPERTIES (
    "type" = "paimon",
    "warehouse" = "gs://bucket/warehouse",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.region" = "region",
    "s3.endpoint" = "storage.googleapis.com"
);
```

## Query Operations

### Basic Query

Once the Catalog is configured, you can query the table data in the Catalog as follows:

```sql
-- 1. Switch to catalog, use database, and query
SWITCH paimon_ctl;
USE paimon_db;
SELECT * FROM paimon_tbl LIMIT 10;

-- 2. Use Paimon database directly
USE paimon_ctl.paimon_db;
SELECT * FROM paimon_tbl LIMIT 10;

-- 3. Use fully qualified name to query
SELECT * FROM paimon_ctl.paimon_db.paimon_tbl LIMIT 10;
```

## Appendix

