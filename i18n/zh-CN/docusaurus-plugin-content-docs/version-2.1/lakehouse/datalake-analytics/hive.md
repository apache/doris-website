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

# Hive

通过连接 Hive Metastore，或者兼容 Hive Metatore 的元数据服务，Doris 可以自动获取 Hive 的库表信息，并进行数据查询。

除了 Hive 外，很多其他系统也会使用 Hive Metastore 存储元数据。所以通过 Hive Catalog，我们不仅能访问 Hive，也能访问使用 Hive Metastore 作为元数据存储的系统。如 Iceberg、Hudi 等。

## 使用须知

1. 将 core-site.xml，hdfs-site.xml 和 hive-site.xml  放到 FE 和 BE 的 conf 目录下。优先读取 conf 目录下的 hadoop 配置文件，再读取环境变量 `HADOOP_CONF_DIR` 的相关配置文件。
2. hive 支持 1/2/3 版本。
3. 支持 Managed Table 和 External Table，支持部分 Hive View。
4. 可以识别 Hive Metastore 中存储的 hive、iceberg、hudi 元数据。
5. 如果 Hadoop 节点配置了 hostname，请确保添加对应的映射关系到 /etc/hosts 文件。

## 创建 Catalog

### Hive On HDFS

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hadoop.username' = 'hive'
);
```

除了 `type` 和 `hive.metastore.uris` 两个必须参数外，还可以通过更多参数来传递连接所需要的信息。

这些参数大多来自于 hadoop 集群的 `core-site.xml`, `hdfs-site.xml` 和 `hive-site.xml` 配置文件中。

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

> 关于 Kerberos 相关配置，请参阅 `连接 Kerberos 认证的 Hive 集群` 一节。

### Hive On ViewFS

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

ViewFS 相关参数可以如上面一样添加到 catalog 配置中，也可以添加到 `conf/core-site.xml` 中。

ViewFS 工作原理和参数配置可以参考 hadoop 相关文档，比如 <https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/ViewFs.html>

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

* s3.connection.maximum：s3 最大连接数，默认 50
* s3.connection.request.timeout：s3 请求超时时间，默认 3000ms
* s3.connection.timeout：s3 连接超时时间，默认 1000ms

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

### Hive With Glue

> 连接 Glue 时，如果是在非 EC2 环境，需要将 EC2 环境里的 `~/.aws` 目录拷贝到当前环境里。也可以下载[AWS Cli](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)工具进行配置，这种方式也会在当前用户目录下创建`.aws`目录。

```sql
CREATE CATALOG hive PROPERTIES (
    "type"="hms",
    "hive.metastore.type" = "glue",
    "glue.endpoint" = "https://glue.us-east-1.amazonaws.com",
    "glue.access_key" = "ak",
    "glue.secret_key" = "sk"
);
```

## 元数据缓存与刷新

针对 Hive Catalog，在 Doris 中会缓存 4 种元数据：

1. 表结构：缓存表的列信息等。
2. 分区值：缓存一个表的所有分区的分区值信息。
3. 分区信息：缓存每个分区的信息，如分区数据格式，分区存储位置、分区值等。
4. 文件信息：缓存每个分区所对应的文件信息，如文件路径位置等。

以上缓存信息不会持久化到 Doris 中，所以在 Doris 的 FE 节点重启、切主等操作，都可能导致缓存失效。缓存失效后，Doris 会直接访问 Hive MetaStore 获取信息，并重新填充缓存。

元数据缓可以根据用户的需要，进行自动、手动，或配置 TTL（Time-to-Live）的方式进行更新。

### 默认行为和 TTL

默认情况下，元数据缓存会在第一次被填充后的 10 分钟后失效。该时间由 fe.conf 的配置参数 `external_cache_expire_time_minutes_after_access` 决定。（注意，在 2.0.1 及以前的版本中，该参数默认值为 1 天）。

例如，用户在 10:00 第一次访问表 A 的元数据，那么这些元数据会被缓存，并且到 10:10 后会自动失效，如果用户在 10:11 再次访问相同的元数据，则会直接访问 Hive MetaStore 获取信息，并重新填充缓存。

`external_cache_expire_time_minutes_after_access` 会影响 Catalog 下的所有 4 种缓存。

针对 Hive 中常用的 `INSERT INTO OVERWRITE PARTITION` 操作，也可以通过配置 `文件信息缓存` 的 TTL，来及时的更新 `文件信息缓存`：

```
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'file.meta.cache.ttl-second' = '60'
);
```

上面的例子中，`file.meta.cache.ttl-second` 设置为 60 秒，则缓存会在 60 秒后失效。这个参数，只会影响 `文件信息缓存`。

也可以将该值设置为 0 来禁用分区文件缓存，每次都会从 Hive MetaStore 直接获取文件信息。

### 手动刷新

用户需要通过 [REFRESH](../../sql-manual/sql-statements/Utility-Statements/REFRESH.md) 命令手动刷新元数据。

1. REFRESH CATALOG：刷新指定 Catalog。

    ```
    REFRESH CATALOG ctl1 PROPERTIES("invalid_cache" = "true");
    ```

    该命令会刷新指定 Catalog 的库列表，表列名以及所有缓存信息等。

    `invalid_cache` 表示是否要刷新缓存。默认为 true。如果为 false，则只会刷新 Catalog 的库、表列表，而不会刷新缓存信息。该参数适用于，用户只想同步新增删的库表信息时。

2. REFRESH DATABASE：刷新指定 Database。

    ```
    REFRESH DATABASE [ctl.]db1 PROPERTIES("invalid_cache" = "true");
    ```

    该命令会刷新指定 Database 的表列名以及 Database 下的所有缓存信息等。

    `invalid_cache` 属性含义同上。默认为 true。如果为 false，则只会刷新 Database 的表列表，而不会刷新缓存信息。该参数适用于，用户只想同步新增删的表信息时。

3. REFRESH TABLE: 刷新指定 Table。

    ```
    REFRESH TABLE [ctl.][db.]tbl1;
    ```

    该命令会刷新指定 Table 下的所有缓存信息等。

### 定时刷新

用户可以在创建 Catalog 时，设置该 Catalog 的定时刷新。

```
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'metadata_refresh_interval_sec' = '600'
);
```

在上例中，`metadata_refresh_interval_sec` 表示每 600 秒刷新一次 Catalog。相当于每隔 600 秒，自动执行一次：

`REFRESH CATALOG ctl1 PROPERTIES("invalid_cache" = "true");`

操作。

定时刷新间隔不得小于 5 秒。

### 自动刷新

自动刷新目前仅支持 Hive Metastore 元数据服务。通过让 FE 节点定时读取 HMS 的 notification event 来感知 Hive 表元数据的变更情况，目前支持处理如下 event：

|事件 | 事件行为和对应的动作 |
|---|---|
| CREATE DATABASE | 在对应数据目录下创建数据库。 |
| DROP DATABASE | 在对应数据目录下删除数据库。 |
| ALTER DATABASE  | 此事件的影响主要有更改数据库的属性信息，注释及默认存储位置等，这些改变不影响 doris 对外部数据目录的查询操作，因此目前会忽略此 event。 |
| CREATE TABLE | 在对应数据库下创建表。 |
| DROP TABLE  | 在对应数据库下删除表，并失效表的缓存。 |
| ALTER TABLE | 如果是重命名，先删除旧名字的表，再用新名字创建表，否则失效该表的缓存。 |
| ADD PARTITION | 在对应表缓存的分区列表里添加分区。 |
| DROP PARTITION | 在对应表缓存的分区列表里删除分区，并失效该分区的缓存。 |
| ALTER PARTITION | 如果是重命名，先删除旧名字的分区，再用新名字创建分区，否则失效该分区的缓存。 |

> 当导入数据导致文件变更，分区表会走 ALTER PARTITION event 逻辑，不分区表会走 ALTER TABLE event 逻辑。
>
> 如果绕过 HMS 直接操作文件系统的话，HMS 不会生成对应事件，doris 因此也无法感知

该特性在 fe.conf 中有如下参数：

1. `enable_hms_events_incremental_sync`: 是否开启元数据自动增量同步功能，默认关闭。
2. `hms_events_polling_interval_ms`: 读取 event 的间隔时间，默认值为 10000，单位：毫秒。
3. `hms_events_batch_size_per_rpc`: 每次读取 event 的最大数量，默认值为 500。

如果想使用该特性 (华为 MRS 除外)，需要更改 HMS 的 hive-site.xml 并重启 HMS 和 HiveServer2：

```
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

```
<property>
    <name>metastore.transactional.event.listeners</name>
    <value>org.apache.hive.hcatalog.listener.DbNotificationListener</value>
</property>
```

## Hive 版本

Doris 可以正确访问不同 Hive 版本中的 Hive Metastore。在默认情况下，Doris 会以 Hive 2.3 版本的兼容接口访问 Hive Metastore。

如在查询时遇到如 `Invalid method name: 'get_table_req'` 类似错误，说明 hive 版本不匹配。

你可以在创建 Catalog 时指定 hive 的版本。如访问 Hive 1.1.0 版本：

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hive.version' = '1.1.0'
);
```

## 列类型映射

适用于 Hive/Iceberge/Hudi

| HMS Type | Doris Type | Comment |
|---|---|---|
| boolean| boolean | |
| tinyint|tinyint | |
| smallint| smallint| |
| int| int | |
| bigint| bigint | |
| date| date| |
| timestamp| datetime| |
| float| float| |
| double| double| |
| char| char | |
| varchar| varchar| |
| decimal| decimal | |
| `array<type>` | `array<type>`| 支持嵌套，如 `array<map<string, int>>` |
| `map<KeyType, ValueType>` | `map<KeyType, ValueType>` | 支持嵌套，如 `map<string, array<int>>` |
| `struct<col1: Type1, col2: Type2, ...>` | `struct<col1: Type1, col2: Type2, ...>` | 支持嵌套，如 `struct<col1: array<int>, col2: map<int, date>>` |
| other | unsupported | |

> 注：是否按照 hive 表的 schema 来截断 char 或者 varchar 列

> 如果会话变量 `truncate_char_or_varchar_columns` 开启，则当 hive 表的 schema 中 char 或者 varchar 列的最大长度和底层 parquet 或者 orc 文件中的 schema 不一致时会按照 hive 表列的最大长度进行截断。

> 该变量默认为 false。

## 使用 broker 访问 HMS

创建 HMS Catalog 时增加如下配置，Hive 外表文件分片和文件扫描将会由名为 `test_broker` 的 broker 完成

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

如需使用 Apache Ranger 为整个 Doris 集群服务进行鉴权，请参阅 [Apache Ranger](../../admin-manual/auth/ranger.md).

### 环境配置

连接开启 Ranger 权限校验的 Hive Metastore 需要增加配置 & 配置环境：

1. 创建 Catalog 时增加：

 ```sql
 "access_controller.properties.ranger.service.name" = "hive",
 "access_controller.class" = "org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory",
 ```

 >注意：
 >
 > `access_controller.properties.ranger.service.name` 指的是 service 的类型，例如 `hive`，`hdfs` 等。并不是配置文件中 `ranger.plugin.hive.service.name` 的值。

2. 配置所有 FE 环境：

    1. 将 HMS conf 目录下的配置文件 ranger-hive-audit.xml,ranger-hive-security.xml,ranger-policymgr-ssl.xml 复制到 FE 的 conf 目录下。

    2. 修改 ranger-hive-security.xml 的属性，参考配置如下：

        ```sql
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

    3. 为获取到 Ranger 鉴权本身的日志，可在 `<doris_home>/conf` 目录下添加配置文件 log4j.properties。

    4. 重启 FE。

### 最佳实践

1. 在 ranger 端创建用户 user1 并授权 db1.table1.col1 的查询权限

2. 在 ranger 端创建角色 role1 并授权 db1.table1.col2 的查询权限

3. 在 doris 创建同名用户 user1，user1 将直接拥有 db1.table1.col1 的查询权限

4. 在 doris 创建同名角色 role1，并将 role1 分配给 user1，user1 将同时拥有 db1.table1.col1 和 col2 的查询权限

5. Admin 和 Root 用户的权限不受 Apache Ranger 的权限控制

## 连接 Kerberos 认证的 Hive 集群

本小节主要介绍如何连接开启 Kerberos 认证的 Hive + HDFS 集群。

### 环境准备

* `krb5.conf`

 `krb5.conf` 是 Kerberos 认证协议的配置文件。需将该文件部署在所有 FE 和 BE 节点上。并确保 Doris 集群可以和文件中记录的 KDC 服务连通。

 默认情况下，该文件位于 Hadoop 集群的 `/etc` 目录下。但请联系 Hadoop 集群管理员获取正确的 `krb5.conf` 文件，并将其部署到所有 FE 和 BE 节点的 `/etc` 目录下。

 注意，某些情况下，`krb5.conf` 的文件位置可能取决于环境变量 `KRB5_CONFIG` 或 JVM 参数中的 `-Djava.security.krb5.conf` 参数。请检查这些属性以确定 `krb5.conf` 的确切位置。

* JVM 参数

 请在 FE 和 BE 的 JVM 参数中添加如下配置（位于 fe.conf 和 be.conf 中）：

 	* `-Djavax.security.auth.useSubjectCredsOnly=false`
 	* `-Dsun.security.krb5.debug=true`

 并重启 FE、BE 节点以确保其生效。

### Catalog 配置

通常情况下，连接 Kerberos 认证的 Hive 集群，需要在 Catalog 中添加如下属性：

* `"hadoop.security.authentication" = "kerberos"`：开启 kerberos 认证方式。
* `"hadoop.kerberos.principal" = "your_principal"`：HDFS namenode 的 principal。通常是 `hdfs-site.xml` 的 `dfs.namenode.kerberos.principal` 配置。
* `"hadoop.kerberos.keytab" = "/path/to/your_keytab"`：HDFS namenode 的 keytab 文件。通常是 `hdfs-site.xml` 的 `dfs.namenode.keytab.file` 配置。注意，这个文件需要部署到所有 FE 和 BE 节点相同的目录下（可自定义）。
* `"yarn.resourcemanager.principal" = "your_principal"`：Yarn Resource Manager 的 principal，可以在 `yarn-site.xml` 中获取。
* `"hive.metastore.kerberos.principal" = "your_principal"`：Hive metastore 的 principal。可以再 `hive-site.xml` 中。

> 注：建议使用 `kinit -kt your_principal /path/to/your_keytab` 以及 `klist -k /path/to/your_keytab` 来

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

### 多 Kerberos 集群配置

如需同时访问多个启用了 Kerberos 的 Hadoop 集群，需要修改 `krb5.conf` 文件并且配置`hadoop.security.auth_to_local`属性，具体操作如下：

1. 在 krb5.conf 文件配置 realms

   配置多集群时，需要把多个 realm 配置到一个 `krb5.conf` 里头，kdc 和 admin_server 也可以是域名。

    ``` properties
    [realms]
    REALM1.COM = {
      kdc = 172.21.16.8:88
      admin_server = 172.21.16.8
    }
    REALM2.COM = {
      kdc = kdc_hostname:88
      admin_server = kdc_hostname
    }
    ```

2. 在 krb5.conf 文件配置 domain_realm，

   查找 kdc 时使用 principal 中的 domain_name 去找相对应的 realm

    ``` properties
    [libdefaults]
      dns_lookup_realm = true
      dns_lookup_kdc = true
    [domain_realm]
      .your-host.example = REALM1.COM
      your-host.example = REALM1.COM
      .your-other-host.example = REALM2.COM
      your-other-host.example = REALM2.COM
    ```

   如果未正确配置，通常会在 doris 的 `log/be.out` 或者 `log/fe.out` 看到两种与 domain_realm 有关的错误：
    * Unable to locate KDC for realm / Cannot locate KDC
    * No service creds

3. 配置 domain 到 realm 的映射

   为了在多集群环境下，能匹配到不同 kerberos 服用用到的的 principal，推荐 `core-site.xml` 添加或修改如下配置：

    ```xml
    <property>
        <name>hadoop.security.auth_to_local</name>
        <value>RULE:[1:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
               RULE:[2:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
               DEFAULT</value>
    </property>
    ```

   如果需要在 Catalog 中单独生效，可以直接配置在 properties 中：

    ```sql
    CREATE CATALOG hive_krb PROPERTIES (
        'type'='hms',
        'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
        'hive.metastore.sasl.enabled' = 'true',
        'hive.metastore.kerberos.principal' = 'your-other-hms-principal',
        'hadoop.security.authentication' = 'kerberos',
        'hadoop.kerberos.keytab' = '/your-other-keytab-filepath/your-other.keytab',   
        'hadoop.kerberos.principal' = 'your-other-principal@YOUR.COM',
        'yarn.resourcemanager.principal' = 'your-other-rm-principal',
        'hadoop.security.auth_to_local' = 'RULE:[1:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
                                       RULE:[2:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
                                       DEFAULT'
    );
    ```

4. 重启 Doris 服务

   检验映射规则是否能正确匹配，只要看访问不同集群时是否出现错误：`NoMatchingRule: No rules applied to user/domain_name@REALM.COM`

### 问题排查

如遇 Kerberos 认证问题，在设置了 JVM 参数 `-Dsun.security.krb5.debug=true` 后，会在 `fe.out` 或 `be.out` 中打印 Kerberos 认证相关信息。可以参考 [FAQ](../../faq/lakehouse-faq) 中的相关错误进行排查。

## Hive Transactional 表

Hive transactional 表是 Hive 中支持 ACID 语义的表。详情可见：<https://cwiki.apache.org/confluence/display/Hive/Hive+Transactions>

### Hive Transactional 表支持情况

|表类型 | 在 Hive 中支持的操作|Hive 表属性 | 支持的 Hive 版本|
|---|---|---|---|
|Full-ACID Transactional Table |支持 Insert, Update, Delete 操作|'transactional'='true', 'transactional_properties'='insert_only'|3.x，2.x，其中 2.x 需要在 Hive 中执行完 major compaction 才可以加载|
|Insert-Only Transactional Table|只支持 Insert 操作|'transactional'='true'|3.x，2.x|

### 当前限制

目前不支持 Original Files 的场景。
当一个表转换成 Transactional 表之后，后续新写的数据文件会使用 Hive Transactional 表的 schema，但是已经存在的数据文件是不会转化成 Transactional 表的 schema，这样的文件称为 Original Files。
