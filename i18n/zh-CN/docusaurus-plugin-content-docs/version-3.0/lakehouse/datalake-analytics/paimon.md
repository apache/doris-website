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

快速体验 [Apache Doris & Paimon](https://doris.apache.org/docs/gettingStarted/tutorials/doris-paimon)

## 使用须知

1. 数据放在 hdfs 时，需要将 core-site.xml，hdfs-site.xml 和 hive-site.xml  放到 FE 和 BE 的 conf 目录下。优先读取 conf 目录下的 hadoop 配置文件，再读取环境变量 `HADOOP_CONF_DIR` 的相关配置文件。
2. 当前适配的 Paimon 版本为 0.8。

## 创建 Catalog

Paimon Catalog 当前支持两种类型的 Metastore 创建 Catalog:
* filesystem（默认），同时存储元数据和数据在 filesystem。
* hive metastore，它还将元数据存储在 Hive metastore 中。用户可以直接从 Hive 访问这些表。

### 基于 FileSystem 创建 Catalog

#### HDFS

```sql
CREATE CATALOG `paimon_hdfs` PROPERTIES (
    "type" = "paimon",
    "warehouse" = "hdfs://HDFS8000871/user/paimon",
    "dfs.nameservices" = "HDFS8000871",
    "dfs.ha.namenodes.HDFS8000871" = "nn1,nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "172.21.0.1:4007",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "172.21.0.2:4007",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider",
    "hadoop.username" = "hadoop"
);

CREATE CATALOG `paimon_kerberos` PROPERTIES (
    'type'='paimon',
    "warehouse" = "hdfs://HDFS8000871/user/paimon",
    "dfs.nameservices" = "HDFS8000871",
    "dfs.ha.namenodes.HDFS8000871" = "nn1,nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "172.21.0.1:4007",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "172.21.0.2:4007",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider",
    'hadoop.security.authentication' = 'kerberos',
    'hadoop.kerberos.keytab' = '/doris/hdfs.keytab',   
    'hadoop.kerberos.principal' = 'hdfs@HADOOP.COM'
);
```

#### MINIO

```sql
CREATE CATALOG `paimon_s3` PROPERTIES (
    "type" = "paimon",
    "warehouse" = "s3://bucket_name/paimons3",
    "s3.endpoint" = "http://<ip>:<port>",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

#### OBS

```sql
CREATE CATALOG `paimon_obs` PROPERTIES (
    "type" = "paimon",
    "warehouse" = "obs://bucket_name/paimon",
    "obs.endpoint"="obs.cn-north-4.myhuaweicloud.com",
    "obs.access_key"="ak",
    "obs.secret_key"="sk"
);
```

#### COS

```sql
CREATE CATALOG `paimon_s3` PROPERTIES (
    "type" = "paimon",
    "warehouse" = "cosn://paimon-1308700295/paimoncos",
    "cos.endpoint" = "cos.ap-beijing.myqcloud.com",
    "cos.access_key" = "ak",
    "cos.secret_key" = "sk"
);
```

#### OSS

```sql
CREATE CATALOG `paimon_oss` PROPERTIES (
    "type" = "paimon",
    "warehouse" = "oss://paimon-zd/paimonoss",
    "oss.endpoint" = "oss-cn-beijing.aliyuncs.com",
    "oss.access_key" = "ak",
    "oss.secret_key" = "sk"
);

```

### 基于 Hive Metastore 创建 Catalog

```sql
CREATE CATALOG `paimon_hms` PROPERTIES (
    "type" = "paimon",
    "paimon.catalog.type" = "hms",
    "warehouse" = "hdfs://HDFS8000871/user/zhangdong/paimon2",
    "hive.metastore.uris" = "thrift://172.21.0.44:7004",
    "dfs.nameservices" = "HDFS8000871",
    "dfs.ha.namenodes.HDFS8000871" = "nn1,nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "172.21.0.1:4007",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "172.21.0.2:4007",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider",
    "hadoop.username" = "hadoop"
);

CREATE CATALOG `paimon_kerberos` PROPERTIES (
    "type" = "paimon",
    "paimon.catalog.type" = "hms",
    "warehouse" = "hdfs://HDFS8000871/user/zhangdong/paimon2",
    "hive.metastore.uris" = "thrift://172.21.0.44:7004",
    "hive.metastore.sasl.enabled" = "true",
    "hive.metastore.kerberos.principal" = "hive/xxx@HADOOP.COM",
    "dfs.nameservices" = "HDFS8000871",
    "dfs.ha.namenodes.HDFS8000871" = "nn1,nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "172.21.0.1:4007",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "172.21.0.2:4007",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider",
    "hadoop.security.authentication" = "kerberos",
    "hadoop.kerberos.principal" = "hdfs@HADOOP.COM",
    "hadoop.kerberos.keytab" = "/doris/hdfs.keytab"
);
```

### 基于 Aliyun DLF 创建 Catalog

该功能自 2.1.7 和 3.0.3 版本支持。

```
CREATE CATALOG `paimon_dlf` PROPERTIES (
    "type" = "paimon",
    "paimon.catalog.type" = "dlf",
    "warehouse" = "oss://xx/yy/",
    "dlf.proxy.mode" = "DLF_ONLY",
    "dlf.uid" = "xxxxx",
    "dlf.region" = "cn-beijing",
    "dlf.access_key" = "ak",
    "dlf.secret_key" = "sk"
    
    -- "dlf.endpoint" = "dlf.cn-beijing.aliyuncs.com",  -- optional
    -- "dlf.catalog.id" = "xxxx", -- optional
);
```

## 列类型映射

| Paimon Data Type                      | Doris Data Type           | Comment   |
|---------------------------------------|---------------------------|-----------|
| BooleanType                           | Boolean                   |           |
| TinyIntType                           | TinyInt                   |           |
| SmallIntType                          | SmallInt                  |           |
| IntType                               | Int                       |           |
| FloatType                             | Float                     |           |
| BigIntType                            | BigInt                    |           |
| DoubleType                            | Double                    |           |
| VarCharType                           | VarChar                   |           |
| CharType                              | Char                      |           |
| VarBinaryType, BinaryType             | String                    |           |
| DecimalType(precision, scale)         | Decimal(precision, scale) |           |
| TimestampType,LocalZonedTimestampType | DateTime                  |           |
| DateType                              | Date                      |           |
| ArrayType                             | Array                     | 支持Array嵌套 |
| MapType                               | Map                       | 支持Map嵌套   |
| RowType                               | Struct                    | 支持Struct嵌套（2.0.10 和 2.1.3 版本开始支持）|

## 常见问题

1. Kerberos 问题

    - 确保 principal 和 keytab 配置正确。
    - 需在 BE 节点启动定时任务（如 crontab），每隔一定时间（如 12 小时），执行一次 `kinit -kt your_principal your_keytab` 命令。

2. Unknown type value: UNSUPPORTED

    这是 Doris 2.0.2 版本和 Paimon 0.5 版本的一个兼容性问题，需要升级到 2.0.3 或更高版本解决，或自行 [patch](https://github.com/apache/doris/pull/24985)

3. 访问对象存储（OSS、S3 等）报错文件系统不支持

    在 2.0.5（含）之前的版本，用户需手动下载以下 jar 包并放置在 `${DORIS_HOME}/be/lib/java_extensions/preload-extensions` 目录下，重启 BE。

    - 访问 OSS：[paimon-oss-0.6.0-incubating.jar](https://repo.maven.apache.org/maven2/org/apache/paimon/paimon-oss/0.6.0-incubating/paimon-oss-0.6.0-incubating.jar)
    - 访问其他对象存储：[paimon-s3-0.6.0-incubating.jar](https://repo.maven.apache.org/maven2/org/apache/paimon/paimon-s3/0.6.0-incubating/paimon-s3-0.6.0-incubating.jar)

    2.0.6 之后的版本不再需要用户手动放置。


