---
{
    "title": "Hive",
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

通过连接 Hive Metastore，Doris 可以自动获取 Hive 的库表信息，进行数据查询、分析。除了 Hive 外，例如 Iceberg、Hudi 等其他系统也会使用 Hive Metastore 存储元数据。通过 Hive Catalog，能轻松集成 Hive 及使用 Hive Metastore 作为元数据存储的系统。

## 注意事项

- 支持 Hive1、Hive2、Hive3 版本。

- 支持 Managed Table 和 External Table，支持部分 Hive View。

- 支持识别 Hive Metastore 中存储的 Hive、Iceberg、Hudi 元数据。

- 将 core-site.xml，hdfs-site.xml 和 hive-site.xml 放到 FE 和 BE 的 conf 目录下。优先读取 conf 目录下的 Hadoop 配置文件，再读取环境变量 `HADOOP_CONF_DIR` 的相关配置文件。

## 创建 Catalog

### Hive On HDFS

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hadoop.username' = 'hive',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:8088',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:8088',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

除了 `type` 和 `hive.metastore.uris` 两个必须参数外，还可以通过更多参数来传递连接所需要的信息。

如提供 HDFS HA 信息，示例如下：

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hadoop.username' = 'hive',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:8088',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:8088',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

### Hive On VIEWFS

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hadoop.username' = 'hive',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:8088',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:8088',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
    'fs.defaultFS' = 'viewfs://your-cluster',
    'fs.viewfs.mounttable.your-cluster.link./ns1' = 'hdfs://your-nameservice/',
    'fs.viewfs.mounttable.your-cluster.homedir' = '/ns1'
);
```

VIEWFS 相关参数可以如上面一样添加到 Catalog 配置中，也可以添加到 `conf/core-site.xml` 中。

VIEWFS 工作原理和参数配置可以参考 Hadoop 相关文档，比如 https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/ViewFs.html

### Hive On JuiceFS

数据存储在 JuiceFS，示例如下：

（需要把 `juicefs-hadoop-x.x.x.jar` 放在 `fe/lib/` 和 `apache_hdfs_broker/lib/` 下）

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hadoop.username' = 'root',
    'fs.jfs.impl' = 'io.juicefs.JuiceFileSystem',
    'fs.AbstractFileSystem.jfs.impl' = 'io.juicefs.JuiceFS',
    'juicefs.meta' = 'xxx'
);
```

### Hive On S3

```sql
CREATE CATALOG hive PROPERTIES (
    "type"="hms",
    "hive.metastore.uris" = "thrift://172.0.0.1:9083",
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
    "use_path_style" = "true"
);
```

可选属性：

- s3.connection.maximum：s3 最大连接数，默认 50

- s3.connection.request.timeout：s3 请求超时时间，默认 3000ms

- s3.connection.timeout：s3 连接超时时间，默认 1000ms

### Hive On OSS

```sql
CREATE CATALOG hive PROPERTIES (
    "type"="hms",
    "hive.metastore.uris" = "thrift://172.0.0.1:9083",
    "oss.endpoint" = "oss.oss-cn-beijing.aliyuncs.com",
    "oss.access_key" = "ak",
    "oss.secret_key" = "sk"
);
```

### Hive On OBS

```sql
CREATE CATALOG hive PROPERTIES (
    "type"="hms",
    "hive.metastore.uris" = "thrift://172.0.0.1:9083",
    "obs.endpoint" = "obs.cn-north-4.myhuaweicloud.com",
    "obs.access_key" = "ak",
    "obs.secret_key" = "sk"
);
```

### Hive On COS

```sql
CREATE CATALOG hive PROPERTIES (
    "type"="hms",
    "hive.metastore.uris" = "thrift://172.0.0.1:9083",
    "cos.endpoint" = "cos.ap-beijing.myqcloud.com",
    "cos.access_key" = "ak",
    "cos.secret_key" = "sk"
);
```

### Hive With AWS Glue

连接 Glue 时，如果是在非 EC2 环境，需要将 EC2 环境里的 ~/.aws 目录拷贝到当前环境里。也可以下载[AWS Cli](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)工具进行配置，这种方式也会在当前用户目录下创建.aws 目录。

现在 Doris 访问 AWS 服务时，支持两种类型的身份认证。

**使用 Catalog 属性认证**

Catalog 支持填写基本的 Credentials 属性，比如：

- 访问 S3 时，可以使用 s3.endpoint，s3.access_key，s3.secret_key。

- 访问 Glue 时，可以使用 glue.endpoint，glue.access_key，glue.secret_key。

以 Iceberg Catalog 访问 Glue 为例，我们可以填写以下属性访问在 Glue 上托管的表：

```sql
CREATE CATALOG glue PROPERTIES (
    "type"="iceberg",
    "iceberg.catalog.type" = "glue",
    "glue.endpoint" = "https://glue.us-east-1.amazonaws.com",
    "glue.access_key" = "ak",
    "glue.secret_key" = "sk"
);
```

**使用系统属性认证**

用于运行在 AWS 资源 (如 EC2 实例) 上的应用程序。可以避免硬编码写入 Credentials，能够增强数据安全性。

当我们在创建 Catalog 时，未填写 Credentials 属性，那么此时会使用 DefaultAWSCredentialsProviderChain，它能够读取系统环境变量或者 instance profile 中配置的属性。

配置环境变量和系统属性的方式可以参考：[AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html) 。

- 可以选择的配置的环境变量有：`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`、`AWS_SESSION_TOKEN`、`AWS_ROLE_ARN`、`AWS_WEB_IDENTITY_TOKEN_FILE`等

- 另外，还可以使用[aws configure](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)直接配置 Credentials 信息，同时在`~/.aws`目录下生成 credentials 文件。

### Hive with 阿里云 DLF

阿里云 Data Lake Formation(DLF) 是阿里云上的统一元数据管理服务，兼容 Hive Metastore 协议，因此也可以和访问 Hive Metastore 一样，连接并访问 DLF。可以参考 [什么是 Data Lake Formation](https://www.aliyun.com/product/bigdata/dlf) 。

**创建 DLF Catalog**

```sql
CREATE CATALOG dlf PROPERTIES (
   "type"="hms",
   "hive.metastore.type" = "dlf",
   "dlf.proxy.mode" = "DLF_ONLY",
   "dlf.endpoint" = "datalake-vpc.cn-beijing.aliyuncs.com",
   "dlf.region" = "cn-beijing",
   "dlf.uid" = "uid",
   "dlf.catalog.id" = "catalog_id", //可选
   "dlf.access_key" = "ak",
   "dlf.secret_key" = "sk"
);
```

其中 `type` 固定为 `hms`。如果需要公网访问阿里云对象存储的数据，可以设置 `"dlf.access.public"="true"`

- `dlf.endpoint`：DLF Endpoint，参阅：[DLF Region 和 Endpoint 对照表](https://www.alibabacloud.com/help/zh/data-lake-formation/latest/regions-and-endpoints)

- `dlf.region`：DLF Region，参阅：[DLF Region 和 Endpoint 对照表](https://www.alibabacloud.com/help/zh/data-lake-formation/latest/regions-and-endpoints)

- `dlf.uid`：阿里云账号。即阿里云控制台右上角个人信息的“云账号 ID”。

- `dlf.catalog.id`(可选)：Catalog Id。用于指定数据目录，如果不填，使用默认的 Catalog ID。

- `dlf.access_key`：AccessKey。可以在 [阿里云控制台](https://ram.console.aliyun.com/manage/ak) 中创建和管理。

- `dlf.secret_key`：SecretKey。可以在 [阿里云控制台](https://ram.console.aliyun.com/manage/ak) 中创建和管理。

其他配置项为固定值，无需改动。

之后，可以像正常的 Hive MetaStore 一样，访问 DLF 下的元数据。

同 Hive Catalog 一样，支持访问 DLF 中的 Hive/Iceberg/Hudi 的元数据信息。

**使用开启了 HDFS 服务的 OSS 存储数据**

1. 确认 OSS 开启了 HDFS 服务。[开通并授权访问 OSS-HDFS 服务](https://help.aliyun.com/document_detail/419505.html?spm=a2c4g.2357115.0.i0)。

2. 下载 SDK。[JindoData SDK 下载](https://github.com/aliyun/alibabacloud-jindodata/blob/master/docs/user/5.x/5.0.0-beta7/jindodata_download.md)。如果集群上已有 SDK 目录，忽略这一步。

3. 解压下载后的 jindosdk.tar.gz 或者在集群上找到 Jindo SDK 的目录，将其 lib 目录下的`jindo-core.jar、jindo-sdk.jar`放到`${DORIS_HOME}/fe/lib`和`${DORIS_HOME}/be/lib/java_extensions/preload-extensions`目录下。

4. 创建 DLF Catalog，并配置`oss.hdfs.enabled`为`true`：

```sql
CREATE CATALOG dlf_oss_hdfs PROPERTIES (
   "type"="hms",
   "hive.metastore.type" = "dlf",
   "dlf.proxy.mode" = "DLF_ONLY",
   "dlf.endpoint" = "datalake-vpc.cn-beijing.aliyuncs.com",
   "dlf.region" = "cn-beijing",
   "dlf.uid" = "uid",
   "dlf.catalog.id" = "catalog_id", //可选
   "dlf.access_key" = "ak",
   "dlf.secret_key" = "sk",
   "oss.hdfs.enabled" = "true"
);
```

当 Jindo SDK 版本与 EMR 集群上所用的版本不一致时，会出现`Plugin not found`的问题，需更换到对应版本。

**访问 DLF Iceberg 表**

```sql
CREATE CATALOG dlf_iceberg PROPERTIES (
   "type"="iceberg",
   "iceberg.catalog.type" = "dlf",
   "dlf.proxy.mode" = "DLF_ONLY",
   "dlf.endpoint" = "datalake-vpc.cn-beijing.aliyuncs.com",
   "dlf.region" = "cn-beijing",
   "dlf.uid" = "uid",
   "dlf.catalog.id" = "catalog_id", //可选
   "dlf.access_key" = "ak",
   "dlf.secret_key" = "sk"
);
```

## 列类型映射

和 Hive Catalog 一致，可参阅 [Hive Catalog](../lakehouse/datalake/hive) 中 列类型映射 一节。

## 元数据缓存与刷新

针对 Hive Catalog，在 Doris 中会缓存 4 种元数据：

- 表结构：缓存表的列信息等。

- 分区值：缓存一个表的所有分区的分区值信息。

- 分区信息：缓存每个分区的信息，如分区数据格式，分区存储位置、分区值等。

- 文件信息：缓存每个分区所对应的文件信息，如文件路径位置等。

以上缓存信息不会持久化到 Doris 中，所以在 Doris 的 FE 节点重启、切主等操作，都可能导致缓存失效。缓存失效后，Doris 会直接访问 Hive MetaStore 获取信息，并重新填充缓存。

元数据缓可以根据用户的需要，进行自动、手动，或配置 TTL（Time-to-Live）的方式进行更新。

### 默认行为和 TTL

默认情况下，元数据缓存会在第一次被填充后的 10 分钟后失效。该时间由 fe.conf 的配置参数 `external_cache_expire_time_minutes_after_access` 决定。（注意，在 2.0.1 及以前的版本中，该参数默认值为 1 天）。

例如，用户在 10:00 第一次访问表 A 的元数据，那么这些元数据会被缓存，并且到 10:10 后会自动失效，如果用户在 10:11 再次访问相同的元数据，则会直接访问 Hive MetaStore 获取信息，并重新填充缓存。

`external_cache_expire_time_minutes_after_access` 会影响 Catalog 下的所有 4 种缓存。

针对 Hive 中常用的 `INSERT INTO OVERWRITE PARTITION` 操作，也可以通过配置 `文件信息缓存` 的 TTL，来及时的更新 `文件信息缓存`：

```Plain
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'file.meta.cache.ttl-second' = '60'
);
```

上面的例子中，`file.meta.cache.ttl-second` 设置为 60 秒，则缓存会在 60 秒后失效。这个参数，只会影响 `文件信息缓存`。

也可以将该值设置为 0 来禁用分区文件缓存，每次都会从 Hive MetaStore 直接获取文件信息。

### 手动刷新

用户需要通过 [REFRESH](../../sql-manual/sql-reference/Utility-Statements/REFRESH) 命令手动刷新元数据。

**REFRESH CATALOG：刷新指定 Catalog。**

```Plain
REFRESH CATALOG ctl1 PROPERTIES("invalid_cache" = "true");
```

- 该命令会刷新指定 Catalog 的库列表，表列名以及所有缓存信息等。

- `invalid_cache` 表示是否要刷新缓存。默认为 true。如果为 false，则只会刷新 Catalog 的库、表列表，而不会刷新缓存信息。该参数适用于，用户只想同步新增删的库表信息时。

**REFRESH DATABASE：刷新指定 Database。**

```Plain
REFRESH DATABASE [ctl.]db1 PROPERTIES("invalid_cache" = "true");
```

- 该命令会刷新指定 Database 的表列名以及 Database 下的所有缓存信息等。

- `invalid_cache` 属性含义同上。默认为 true。如果为 false，则只会刷新 Database 的表列表，而不会刷新缓存信息。该参数适用于，用户只想同步新增删的表信息时。

**REFRESH TABLE: 刷新指定 Table。**

```Plain
REFRESH TABLE [ctl.][db.]tbl1;
```

- 该命令会刷新指定 Table 下的所有缓存信息等。

### 定时刷新

用户可以在创建 Catalog 时，设置该 Catalog 的定时刷新。

```Plain
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'metadata_refresh_interval_sec' = '600'
);
```

在上例中，`metadata_refresh_interval_sec` 表示每 600 秒刷新一次 Catalog。相当于每隔 600 秒，自动执行一次如下操作：

```
REFRESH CATALOG ctl1 PROPERTIES("invalid_cache" = "true");
```

注意：定时刷新间隔不得小于 5 秒。

### 自动刷新

自动刷新目前仅支持 Hive Metastore 元数据服务。通过让 FE 节点定时读取 HMS 的 notification event 来感知 Hive 表元数据的变更情况，目前支持处理如下 event：

| 事件            | 事件行为和对应的动作                                         |
| --------------- | ------------------------------------------------------------ |
| CREATE DATABASE | 在对应数据目录下创建数据库。                                 |
| DROP DATABASE   | 在对应数据目录下删除数据库。                                 |
| ALTER DATABASE  | 此事件的影响主要有更改数据库的属性信息，注释及默认存储位置等，这些改变不影响 doris 对外部数据目录的查询操作，因此目前会忽略此 event。 |
| CREATE TABLE    | 在对应数据库下创建表。                                       |
| DROP TABLE      | 在对应数据库下删除表，并失效表的缓存。                       |
| ALTER TABLE     | 如果是重命名，先删除旧名字的表，再用新名字创建表，否则失效该表的缓存。 |
| ADD PARTITION   | 在对应表缓存的分区列表里添加分区。                           |
| DROP PARTITION  | 在对应表缓存的分区列表里删除分区，并失效该分区的缓存。       |
| ALTER PARTITION | 如果是重命名，先删除旧名字的分区，再用新名字创建分区，否则失效该分区的缓存。 |

当导入数据导致文件变更，分区表会走 ALTER PARTITION event 逻辑，不分区表会走 ALTER TABLE event 逻辑。

如果绕过 HMS 直接操作文件系统的话，HMS 不会生成对应事件，doris 因此也无法感知

该特性在 fe.conf 中有如下参数：

- `enable_hms_events_incremental_sync`: 是否开启元数据自动增量同步功能，默认关闭。

- `hms_events_polling_interval_ms`: 读取 event 的间隔时间，默认值为 10000，单位：毫秒。

- `hms_events_batch_size_per_rpc`: 每次读取 event 的最大数量，默认值为 500。

如果想使用该特性 (华为 MRS 除外)，需要更改 HMS 的 hive-site.xml 并重启 HMS 和 HiveServer2：

```Plain
<property>
    <name>hive.metastore.event.db.notification.api.auth</name>
    <value>false</value>
</property>
<property>
    <name>hive.metastore.dml.events</name>
    <value>true</value>
</property>
<property>
    <name>hive.metastore.transactional.event.listeners</name>
    <value>org.apache.hive.hcatalog.listener.DbNotificationListener</value>
</property>
```

华为的 MRS 需要更改 hivemetastore-site.xml 并重启 HMS 和 HiveServer2：

```Plain
<property>
    <name>metastore.transactional.event.listeners</name>
    <value>org.apache.hive.hcatalog.listener.DbNotificationListener</value>
</property>
```

## Hive 版本

Doris 可以正确访问不同 Hive 版本中的 Hive Metastore。在默认情况下，Doris 会以 Hive 2.3 版本的兼容接口访问 Hive Metastore。

如在查询时遇到如 `Invalid method name: 'get_table_req'` 类似错误，说明 hive 版本不匹配。

你可以在创建 Catalog 时指定 Hive 的版本。如访问 Hive 1.1.0 版本：

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hive.version' = '1.1.0'
);
```

## 列类型映射

适用于 Hive/Iceberge/Hudi

| HMS Type                              | Doris Type                            | Comment                                                     |
| ------------------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| boolean                               | boolean                               |                                                             |
| tinyint                               | tinyint                               |                                                             |
| smallint                              | smallint                              |                                                             |
| int                                   | int                                   |                                                             |
| bigint                                | bigint                                |                                                             |
| date                                  | date                                  |                                                             |
| timestamp                             | datetime                              |                                                             |
| float                                 | float                                 |                                                             |
| double                                | double                                |                                                             |
| char                                  | char                                  |                                                             |
| varchar                               | varchar                               |                                                             |
| decimal                               | decimal                               |                                                             |
| array<type\>                           | array<type\>                          | 支持嵌套，如 `array<map<string, int>> `                       |
| map<KeyType, ValueType\>              | map<KeyType, ValueType\>               | 支持嵌套，如 `map<string, array<int>>`                        |
| struct<col1: Type1, col2: Type2, ...> | struct<col1: Type1, col2: Type2, ...> | 支持嵌套，如 `struct<col1: array<int>, col2: map<int, date>>` |
| other                                 | unsupported                           |                                                             |

:::tip
**是否按照 hive 表的 schema 来截断 char 或者 varchar 列**

如果变量 `truncate_char_or_varchar_columns` 开启，则当 Hive 表的 Schema 中 Char 或者 Varchar 列的最大长度和底层 Parquet 或者 ORC 文件中的 Schema 不一致时会按照 Hive 表列的最大长度进行截断。

该变量默认为 false。
:::

## 使用 Broker 访问 HMS

创建 HMS Catalog 时增加如下配置，Hive 外表文件分片和文件扫描将会由名为 `test_broker` 的 Broker 完成

```sql
"broker.name" = "test_broker"
```

Doris 基于 Iceberg `FileIO` 接口实现了 Broker 查询 HMS Catalog Iceberg 的支持。如有需求，可以在创建 HMS Catalog 时增加如下配置。

```sql
"io-impl" = "org.apache.doris.datasource.iceberg.broker.IcebergBrokerIO"
```

## 集成 Apache Ranger

Apache Ranger 是一个用来在 Hadoop 平台上进行监控，启用服务，以及全方位数据安全访问管理的安全框架。

Doris 支持为指定的 External Hive Catalog 使用 Apache Ranger 进行鉴权。

目前支持 Ranger 的库、表、列的鉴权，暂不支持加密、行权限、Data Mask 等功能。

如需使用 Apache Ranger 为整个 Doris 集群服务进行鉴权，请参阅 [使用 Apache Ranger 鉴权](../../admin-manual/privilege-ldap/ranger)

### 环境配置

连接开启 Ranger 权限校验的 Hive Metastore 需要增加配置 & 配置环境：

**1. 创建 Catalog 时增加：**

```sql
"access_controller.properties.ranger.service.name" = "hive",
"access_controller.class" = "org.apache.doris.catalog.authorizer.RangerHiveAccessControllerFactory",
```

:::caution
注意：`access_controller.properties.ranger.service.name` 指的是 service 的类型，例如 `hive`，`hdfs` 等。并不是配置文件中 `ranger.plugin.hive.service.name` 的值。
:::

**2. 配置所有 FE 环境：**

1. 将 HMS conf 目录下的配置文件 ranger-hive-audit.xml,ranger-hive-security.xml,ranger-policymgr-ssl.xml 复制到 FE 的 conf 目录下。

2. 修改 ranger-hive-security.xml 的属性，参考配置如下：

    ```SQL
    <?xml version="1.0" encoding="UTF-8"?>
    <?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
    <configuration>
        #The directory for caching permission data, needs to be writable
        <property>
            <name>ranger.plugin.hive.policy.cache.dir</name>
            <value>/mnt/datadisk0/zhangdong/rangerdata</value>
        </property>
        #The time interval for periodically pulling permission data
        <property>
            <name>ranger.plugin.hive.policy.pollIntervalMs</name>
            <value>30000</value>
        </property>
    
        <property>
            <name>ranger.plugin.hive.policy.rest.client.connection.timeoutMs</name>
            <value>60000</value>
        </property>
    
        <property>
            <name>ranger.plugin.hive.policy.rest.client.read.timeoutMs</name>
            <value>60000</value>
        </property>
    
        <property>
            <name>ranger.plugin.hive.policy.rest.ssl.config.file</name>
            <value></value>
        </property>
    
        <property>
            <name>ranger.plugin.hive.policy.rest.url</name>
            <value>http://172.21.0.32:6080</value>
        </property>
    
        <property>
            <name>ranger.plugin.hive.policy.source.impl</name>
            <value>org.apache.ranger.admin.client.RangerAdminRESTClient</value>
        </property>
    
        <property>
            <name>ranger.plugin.hive.service.name</name>
            <value>hive</value>
        </property>
    
        <property>
            <name>xasecure.hive.update.xapolicies.on.grant.revoke</name>
            <value>true</value>
        </property>
    
    </configuration>
    ```

4. 为获取到 Ranger 鉴权本身的日志，可在 `<doris_home>/conf` 目录下添加配置文件 log4j.properties。

5. 重启 FE。

### 最佳实践

1. 在 ranger 端创建用户 user1 并授权 db1.table1.col1 的查询权限

2. 在 ranger 端创建角色 role1 并授权 db1.table1.col2 的查询权限

3. 在 Doris 创建同名用户 user1，user1 将直接拥有 db1.table1.col1 的查询权限

4. 在 Doris 创建同名角色 role1，并将 role1 分配给 user1，user1 将同时拥有 db1.table1.col1 和 col2 的查询权限

5. Admin 和 Root 用户的权限不受 Apache Ranger 的权限控制

## 使用 Kerberos 进行认证

Kerberos 是一种身份验证协议。它的设计目的是通过使用私钥加密技术为应用程序提供强身份验证。

### 环境配置

**1. 当集群中的服务配置了 Kerberos 认证，配置 Hive Catalog 时需要获取它们的认证信息。**

- `hadoop.kerberos.keytab`: 记录了认证所需的 principal，Doris 集群中的 keytab 必须是同一个。

- `hadoop.kerberos.principal`: Doris 集群上找对应 hostname 的 principal，如`doris/hostname@HADOOP.COM`，用`klist -kt`检查 keytab。

- `yarn.resourcemanager.principal`: 到 Yarn Resource Manager 节点，从 `yarn-site.xml` 中获取，用`klist -kt`检查 Yarn 的 keytab。

- `hive.metastore.kerberos.principal`: 到 Hive 元数据服务节点，从 `hive-site.xml` 中获取，用`klist -kt`检查 Hive 的 keytab。

- `hadoop.security.authentication`: 开启 Hadoop Kerberos 认证。

在所有的 `BE`、`FE` 节点下放置 `krb5.conf` 文件和 `keytab` 认证文件，`keytab` 认证文件路径和配置保持一致，`krb5.conf` 文件默认放置在 `/etc/krb5.conf` 路径。同时需确认 JVM 参数 `-Djava.security.krb5.conf` 和环境变量`KRB5_CONFIG`指向了正确的 `krb5.conf` 文件的路径。

**2. 当配置完成后，如在`FE`、`BE`日志中无法定位到问题，可以开启 Kerberos 调试。**

- 在所有的 `FE`、`BE` 节点下，找到部署路径下的`conf/fe.conf`以及`conf/be.conf`。

- 找到配置文件后，在`JAVA_OPTS`变量中设置 JVM 参数`-Dsun.security.krb5.debug=true`开启 Kerberos 调试。

- `FE`节点的日志路径`log/fe.out`可查看 FE Kerberos 认证调试信息，`BE`节点的日志路径`log/be.out`可查看 BE Kerberos 认证调试信息。

- 相关错误解决方法请参阅：[常见问题](../../faq/lakehouse-faq)

### 最佳实践

示例如下：

```sql
CREATE CATALOG hive_krb PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hive.metastore.sasl.enabled' = 'true',
    'hive.metastore.kerberos.principal' = 'your-hms-principal',
    'hadoop.security.authentication' = 'kerberos',
    'hadoop.kerberos.keytab' = '/your-keytab-filepath/your.keytab',   
    'hadoop.kerberos.principal' = 'your-principal@YOUR.COM',
    'yarn.resourcemanager.principal' = 'your-rm-principal'
);
```

同时提供 HDFS HA 信息和 Kerberos 认证信息，示例如下：

```sql
CREATE CATALOG hive_krb_ha PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hive.metastore.sasl.enabled' = 'true',
    'hive.metastore.kerberos.principal' = 'your-hms-principal',
    'hadoop.security.authentication' = 'kerberos',
    'hadoop.kerberos.keytab' = '/your-keytab-filepath/your.keytab',   
    'hadoop.kerberos.principal' = 'your-principal@YOUR.COM',
    'yarn.resourcemanager.principal' = 'your-rm-principal',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:8088',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:8088',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

## Hive Transactional 表

Hive transactional 表是 Hive 中支持 ACID 语义的表。详情可见：https://cwiki.apache.org/confluence/display/Hive/Hive+Transactions

### Hive Transactional 表支持情况

| 表类型                          | 在 Hive 中支持的操作             | Hive 表属性                                                  | 支持的 Hive 版本                                              |
| ------------------------------- | -------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Full-ACID Transactional Table   | 支持 Insert, Update, Delete 操作 | 'transactional'='true', 'transactional_properties'='insert_only' | 3.x，2.x，其中 2.x 需要在 Hive 中执行完 major compaction 才可以加载 |
| Insert-Only Transactional Table | 只支持 Insert 操作               | 'transactional'='true'                                       | 3.x，2.x                                                     |

### 当前限制

目前不支持 Original Files 的场景。当一个表转换成 Transactional 表之后，后续新写的数据文件会使用 Hive Transactional 表的 schema，但是已经存在的数据文件是不会转化成 Transactional 表的 schema，这样的文件称为 Original Files。
