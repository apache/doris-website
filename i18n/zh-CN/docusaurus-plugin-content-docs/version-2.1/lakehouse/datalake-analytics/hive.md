---
{
    "title": "Hive Catalog",
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

通过连接 Hive Metastore，或者兼容 Hive Metatore 的元数据服务，Doris 可以自动获取 Hive 的库表信息，并进行数据查询。

除了 Hive 外，很多其他系统也会使用 Hive Metastore 存储元数据。所以通过 Hive Catalog，我们不仅能访问 Hive，也能访问使用 Hive Metastore 作为元数据存储的系统。如 Iceberg、Hudi 等。

## 使用须知

1. 将 `core-site.xml`，`hdfs-site.xml` 和 `hive-site.xml` 放到 FE 和 BE 的 `conf` 目录下。优先读取 `conf` 目录下的 `hadoop` 配置文件，再读取环境变量 `HADOOP_CONF_DIR` 的相关配置文件。
2. Hive 支持 1/2/3 版本。
3. 支持 Managed Table 和 External Table，支持部分 Hive View。
4. 可以识别 Hive Metastore 中存储的 Hive、Iceberg、Hudi 元数据。
5. 如果 Hadoop 节点配置了 `hostname`，请确保添加对应的映射关系到 `/etc/hosts` 文件。

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

ViewFS 相关参数可以如上面一样添加到 Catalog 配置中，也可以添加到 `conf/core-site.xml` 中。

ViewFS 工作原理和参数配置可以参考 Hadoop 相关文档，比如 [ViewFS Guide](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/ViewFs.html)。

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

### Doris 访问腾讯云 DLC

:::note
Doris 2.0.13 / 2.1.5 后支持该功能
:::

腾讯云 [DLC](https://cloud.tencent.com/product/dlc) 采用HMS管理元数据，因此可用 Hive catalog 进行联邦分析。
DLC 可基于 lakefs 或 cosn 进行数据存储。以下 catalog 创建方法对两种 FS 都适用。
```sql
CREATE CATALOG dlc PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://<dlc_metastore_ip>:<dlc_metastore_port>',
    's3.access_key' = 'xxxxx',
    's3.secret_key' = 'xxxxx',
    's3.region' = 'ap-xxx',
    's3.endpoint' = 'cos.ap-xxx.myqcloud.com',
    'fs.cosn.bucket.region' = 'ap-xxx',
    'fs.ofs.user.appid' = '<your_tencent_cloud_appid>',
    'fs.ofs.tmp.cache.dir' = '<tmp_cache_dir>'
);
```

创建完 catalog 后需要对 catalog 绑定的 appid 进行[授权](https://cloud.tencent.com/document/product/436/38648) 。

### Hive On S3

```sql
CREATE CATALOG hive PROPERTIES (
    "type"="hms",
    "hive.metastore.uris" = "thrift://172.0.0.1:9083",
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "use_path_style" = "true"
);
```

可选属性：

* s3.connection.maximum：S3 最大连接数，默认 50
* s3.connection.request.timeout：S3 请求超时时间，默认 3000ms
* s3.connection.timeout：S3 连接超时时间，默认 1000ms

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

> 连接 Glue 时，如果是在非 EC2 环境，需要将 EC2 环境里的 `~/.aws` 目录拷贝到当前环境里。也可以下载 [AWS Cli](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) 工具进行配置，这种方式也会在当前用户目录下创建 `.aws` 目录。

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

关于元数据缓存和刷新机制，请参阅 [元数据缓存文档](../metacache.md)。

这里主要介绍，基于 Hive Metastore 元数据事件的自定元数据订阅

### 订阅 Hive Metastore

通过让 FE 节点定时读取 HMS 的 Notification Event 来感知 Hive 表元数据的变更情况，目前支持处理如下 Event：

|事件 | 事件行为和对应的动作 |
|---|---|
| CREATE DATABASE | 在对应数据目录下创建数据库。 |
| DROP DATABASE | 在对应数据目录下删除数据库。 |
| ALTER DATABASE  | 此事件的影响主要有更改数据库的属性信息，注释及默认存储位置等，这些改变不影响 Doris 对外部数据目录的查询操作，因此目前会忽略此 Event。 |
| CREATE TABLE | 在对应数据库下创建表。 |
| DROP TABLE  | 在对应数据库下删除表，并失效表的缓存。 |
| ALTER TABLE | 如果是重命名，先删除旧名字的表，再用新名字创建表，否则失效该表的缓存。 |
| ADD PARTITION | 在对应表缓存的分区列表里添加分区。 |
| DROP PARTITION | 在对应表缓存的分区列表里删除分区，并失效该分区的缓存。 |
| ALTER PARTITION | 如果是重命名，先删除旧名字的分区，再用新名字创建分区，否则失效该分区的缓存。 |

> 当导入数据导致文件变更，分区表会走 ALTER PARTITION Event 逻辑，不分区表会走 ALTER TABLE Event 逻辑。
>
> 如果绕过 HMS 直接操作文件系统的话，HMS 不会生成对应事件，Doris 因此也无法感知

该特性在 `fe.conf` 中有如下参数：

1. `enable_hms_events_incremental_sync`: 是否开启元数据自动增量同步功能，默认关闭。
2. `hms_events_polling_interval_ms`: 读取 event 的间隔时间，默认值为 10000，单位：毫秒。
3. `hms_events_batch_size_per_rpc`: 每次读取 event 的最大数量，默认值为 500。

如果想使用该特性 (华为 MRS 除外)，需要更改 HMS 的 `hive-site.xml` 并重启 HMS 和 HiveServer2：

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

华为的 MRS 需要更改 `hivemetastore-site.xml` 并重启 HMS 和 HiveServer2：

```
<property>
    <name>metastore.transactional.event.listeners</name>
    <value>org.apache.hive.hcatalog.listener.DbNotificationListener</value>
</property>
```

## Hive 版本

Doris 可以正确访问不同 Hive 版本中的 Hive Metastore。在默认情况下，Doris 会以 Hive 2.3 版本的兼容接口访问 Hive Metastore。

如在查询时遇到如 `Invalid method name: 'get_table_req'` 类似错误，说明 Hive 版本不匹配。

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

> 注：是否按照 Hive 表的 Schema 来截断 `char` 或者 `varchar` 列

> 如果会话变量 `truncate_char_or_varchar_columns` 开启，则当 Hive 表的 Schema 中 `char` 或者 `varchar` 列的最大长度和底层 Parquet 或者 ORC 文件中的 `schema` 不一致时会按照 Hive 表列的最大长度进行截断。

> 该变量默认为 `false`。

## 查询 Hive 分区

可以通过下面两种方式查询 Hive 分区信息。

- `SHOW PARTITIONS FROM hive_table`

    该语句可以列出指定 Hive 表的所有分区以及分区值信息。

- 使用 `table$partitions` 元数据表

    自 2.1.7 和 3.0.3 版本开始，用户可以通过 `table$partitions` 元数据表查询 Hive 分区信息。`table$partitions` 本质上是一个关系表，所以可以使用在任意 SELECT 语句中。

    ```
    SELECT * FROM hive_table$partitions;
    ```

## 使用 broker 访问 HMS

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

如需使用 Apache Ranger 为整个 Doris 集群服务进行鉴权，请参阅 [Apache Ranger](../../admin-manual/auth/ranger.md)

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

    1. 将 HMS `conf` 目录下的配置文件 `ranger-hive-audit.xml`, `ranger-hive-security.xml`, `ranger-policymgr-ssl.xml` 复制到 FE 的 `conf` 目录下。

    2. 修改 `ranger-hive-security.xml` 的属性，参考配置如下：

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

    3. 为获取到 Ranger 鉴权本身的日志，可在 `<doris_home>/conf` 目录下添加配置文件 `log4j.properties`。

    4. 重启 FE。

### 最佳实践

1. 在 Ranger 端创建用户 user1 并授权 db1.table1.col1 的查询权限

2. 在 Ranger 端创建角色 role1 并授权 db1.table1.col2 的查询权限

3. 在 Doris 创建同名用户 user1，user1 将直接拥有 db1.table1.col1 的查询权限

4. 在 Doris 创建同名角色 role1，并将 role1 分配给 user1，user1 将同时拥有 db1.table1.col1 和 col2 的查询权限

5. Admin 和 Root 用户的权限不受 Apache Ranger 的权限控制

## 连接 Kerberos 认证的 Hive 集群

本小节主要介绍如何连接开启 Kerberos 认证的 Hive + HDFS 集群。

### 环境准备

* `krb5.conf`

 `krb5.conf` 是 Kerberos 认证协议的配置文件。需将该文件部署在所有 FE 和 BE 节点上。并确保 Doris 集群可以和文件中记录的 KDC 服务连通。

 默认情况下，该文件位于 Hadoop 集群的 `/etc` 目录下。但请联系 Hadoop 集群管理员获取正确的 `krb5.conf` 文件，并将其部署到所有 FE 和 BE 节点的 `/etc` 目录下。

 注意，某些情况下，`krb5.conf` 的文件位置可能取决于环境变量 `KRB5_CONFIG` 或 JVM 参数中的 `-Djava.security.krb5.conf` 参数。请检查这些属性以确定 `krb5.conf` 的确切位置。

 如需自定义`krb5.conf`的位置：

 - FE：在 `fe.conf` 配置 JVM 参数 `-Djava.security.krb5.conf`。
 - BE：在 `be.conf` 使用 `kerberos_krb5_conf_path` 配置项，默认值为`/etc/krb5.conf`。

* JVM 参数

 请在 FE 和 BE 的 JVM 参数中添加如下配置（位于 `fe.conf` 和 `be.conf` 中）：

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

如需同时访问多个启用了 Kerberos 的 Hadoop 集群，需要修改 `krb5.conf` 文件并且配置 `hadoop.security.auth_to_local` 属性，具体操作如下：

1. 在 `krb5.conf` 文件配置 Realms

    配置多集群时，需要把多个 Realm 配置到一个 `krb5.conf` 里头，`kdc` 和 `admin_server` 也可以是域名。

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

2. 在 `krb5.conf` 文件配置 `domain_realm`，

    查找 `kdc` 时使用 Principal 中的 `domain_name` 去找相对应的 Realm

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

    如果未正确配置，通常会在 Doris 的 `log/be.out` 或者 `log/fe.out` 看到两种与 `domain_realm` 有关的错误：
   * Unable to locate KDC for realm / Cannot locate KDC
   * No service creds

3. 配置 Domain 到 Realm 的映射

    为了在多集群环境下，能匹配到不同 Kerberos 服用用到的的 Principal，推荐 `core-site.xml` 添加或修改如下配置：

    ```xml
    <property>
        <name>hadoop.security.auth_to_local</name>
        <value>RULE:[1:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
               RULE:[2:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
               DEFAULT</value>
    </property>
    ```

    如果需要在 Catalog 中单独生效，可以直接配置在 Properties 中：

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

Hive Transactional 表是 Hive 中支持 ACID 语义的表。详情可见 [Hive Transactions](https://cwiki.apache.org/confluence/display/Hive/Hive+Transactions)。

### Hive Transactional 表支持情况

|表类型 | 在 Hive 中支持的操作|Hive 表属性 | 支持的 Hive 版本|
|---|---|---|---|
|Full-ACID Transactional Table |支持 Insert, Update, Delete 操作|'transactional'='true', 'transactional_properties'='insert_only'|3.x，2.x，其中 2.x 需要在 Hive 中执行完 Major Compaction 才可以加载|
|Insert-Only Transactional Table|只支持 Insert 操作|'transactional'='true'|3.x，2.x|

### 当前限制

目前不支持 Original Files 的场景。
当一个表转换成 Transactional 表之后，后续新写的数据文件会使用 Hive Transactional 表的 Schema，但是已经存在的数据文件是不会转化成 Transactional 表的 Schema，这样的文件称为 Original Files。

## 最佳实践

- Hive Text 格式表的中空行行为的处理

    默认情况下，Doris 会忽略 Text 格式表中的空行。从 2.1.5 版本开始，可以通过设置会话变量 `read_csv_empty_line_as_null` 来控制该行为。

    `set read_csv_empty_line_as_null = true;`

    该变量默认为 false，表示忽略空行。如果设置为 true，这空行会读取为“所有列都是 null” 的行并返回，这种行为和部分 Hadoop 生态中查询引擎的行为一致。
