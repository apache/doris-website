---
{
    "title": "Hive Catalog",
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

By connecting to Hive Metastore, or a metadata service compatible with Hive Metatore, Doris can automatically obtain Hive database table information and perform data queries.

In addition to Hive, many other systems also use the Hive Metastore to store metadata. So through Hive Catalog, we can not only access Hive, but also access systems that use Hive Metastore as metadata storage. Such as Iceberg, Hudi, etc.

## Terms and Conditions

1. Need to put core-site.xml, hdfs-site.xml and hive-site.xml in the conf directory of FE and BE. First read the hadoop configuration file in the conf directory, and then read the related to the environment variable `HADOOP_CONF_DIR` configuration file.
2. hive supports version 1/2/3.
3. Support Managed Table and External Table and part of Hive View.
4. Can identify hive, iceberg, hudi metadata stored in Hive Metastore.
5. If the Hadoop node is configured with hostname, please ensure to add the corresponding mapping relationship to the /etc/hosts file.

## Create Catalog

### Hive On HDFS

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hadoop.username' = 'hive'
);
```

In addition to the two required parameters of `type` and `hive.metastore.uris`, more parameters can be passed to pass the information required for the connection.

Most of this properties can be found in `core-site.xml`, `hdfs-site.xml` and `hive-site.xml`.

If HDFS HA information is provided, the example is as follows:

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

> About Kerberos, please see `Connect to Kerberos enabled Hive`.

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

ViewFs related parameters can be added to the catalog configuration as above, or added to `conf/core-site.xml`.

How ViewFs works and parameter configuration, please refer to relevant hadoop documents, for example, <https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/ViewFs.html>

### Hive On JuiceFS

Data is stored in JuiceFS, examples are as follows:

(Need to put `juicefs-hadoop-x.x.x.jar` under `fe/lib/` and `apache_hdfs_broker/lib/`)

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

### Doris query DLC

:::note
Supported since Doris version 2.0.13 / 2.1.5
:::

[DLC](https://cloud.tencent.com/product/dlc) of Tencent Cloud use HMS to manage its metadata, so Hive catalog can be used。
DLC stores data on LakeFS or COSN, below catalog is compatible with both file system.
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

After create catalog, you need to [grant](https://cloud.tencent.com/document/product/436/38648) essential privilege to the appid your dlc catalog is using.

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

Options:

* s3.connection.maximum: s3 maximum connection number, default 50
* s3.connection.request.timeout: s3 request timeout, default 3000ms
* s3.connection.timeout: s3 connection timeout, default 1000ms

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

> When connecting Glue, if it's not on the EC2 environment, need copy the `~/.aws` from the EC2 environment to the current environment. And can also download and configure the [AWS Cli tools](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), which also creates the `.aws` directory under the current user directory.

```sql
CREATE CATALOG hive PROPERTIES (
    "type"="hms",
    "hive.metastore.type" = "glue",
    "glue.endpoint" = "https://glue.us-east-1.amazonaws.com",
    "glue.access_key" = "ak",
    "glue.secret_key" = "sk"
);
```

## Metadata Cache & Refresh

For metadata cache and refresh mechanisms, please refer to [Metadata Cache Documentation](../metacache.md).

Here we mainly introduce automatic metadata subscription based on Hive Metastore metadata events.

### Subscribe to Hive Metastore

By letting FE nodes read HMS Notification Events regularly to perceive changes in Hive table metadata, we currently support processing the following Events:

| Event           | Corresponding Update Operation                               |
| :-------------- | :----------------------------------------------------------- |
| CREATE DATABASE | Create a database in the corresponding catalog.              |
| DROP DATABASE   | Delete a database in the corresponding catalog.              |
| ALTER DATABASE  | Such alterations mainly include changes in properties, comments, or storage location of databases. They do not affect Doris' queries in External Catalogs so they will not be synchronized. |
| CREATE TABLE    | Create a table in the corresponding database.                |
| DROP TABLE      | Delete a table in the corresponding database, and invalidate the cache of that table. |
| ALTER TABLE     | If it is a renaming, delete the table of the old name, and then create a new table with the new name; otherwise, invalidate the cache of that table. |
| ADD PARTITION   | Add a partition to the cached partition list of the corresponding table. |
| DROP PARTITION  | Delete a partition from the cached partition list of the corresponding table, and invalidate the cache of that partition. |
| ALTER PARTITION | If it is a renaming, delete the partition of the old name, and then create a new partition with the new name; otherwise, invalidate the cache of that partition. |

> After data ingestion, changes in partition tables will follow the `ALTER PARTITION` logic, while those in non-partition tables will follow the `ALTER TABLE` logic.
>
> If changes are conducted on the file system directly instead of through the HMS, the HMS will not generate an event. As a result, such changes will not be perceived by Doris.

The automatic update feature involves the following parameters in fe.conf:

1. `enable_hms_events_incremental_sync`: This specifies whether to enable automatic incremental synchronization for metadata, which is disabled by default.
2. `hms_events_polling_interval_ms`: This specifies the interval between two readings, which is set to 10000 by default. (Unit: millisecond)
3. `hms_events_batch_size_per_rpc`: This specifies the maximum number of events that are read at a time, which is set to 500 by default.

To enable automatic update(Excluding Huawei MRS), you need to modify the hive-site.xml of HMS and then restart HMS and HiveServer2:

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

Huawei's MRS needs to change hivemetastore-site.xml and restart HMS and HiveServer2:

```
<property>
    <name>metastore.transactional.event.listeners</name>
    <value>org.apache.hive.hcatalog.listener.DbNotificationListener</value>
</property>
```

Note: Value is appended with commas separated from the original value, not overwritten.For example, the default configuration for MRS 3.1.0 is

```
<property>
    <name>metastore.transactional.event.listeners</name>
    <value>com.huawei.bigdata.hive.listener.TableKeyFileManagerListener,org.apache.hadoop.hive.metastore.listener.FileAclListener</value>
</property>
```

We need to change to

```
<property>
    <name>metastore.transactional.event.listeners</name>
    <value>com.huawei.bigdata.hive.listener.TableKeyFileManagerListener,org.apache.hadoop.hive.metastore.listener.FileAclListener,org.apache.hive.hcatalog.listener.DbNotificationListener</value>
</property>
```

> Note: To enable automatic update, whether for existing Catalogs or newly created Catalogs, all you need is to set `enable_hms_events_incremental_sync` to `true`, and then restart the FE node. You don't need to manually update the metadata before or after the restart.

## Hive Version

Doris can correctly access the Hive Metastore in different Hive versions. By default, Doris will access the Hive Metastore with a Hive 2.3 compatible interface.

If you meet error message like `Invalid method name: 'get_table_req'`, which means the hive version is mismatch.

You can specify the hive version when creating the Catalog. If accessing Hive 1.1.0 version:

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hive.version' = '1.1.0'
);
```

## Column type mapping

For Hive/Iceberge/Hudi

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
| `array<type>` | `array<type>`| support nested type, for example `array<array<int>>` |
| `map<KeyType, ValueType>` | `map<KeyType, ValueType>` | support nested type, for example `map<string, array<int>>` |
| `struct<col1: Type1, col2: Type2, ...>` | `struct<col1: Type1, col2: Type2, ...>` | support nested type, for example `struct<col1: array<int>, col2: map<int, date>>` |
| other | unsupported | |

> Note: Whether to truncate char or varchar columns according to the schema of the hive table

> If the session variable `truncate_char_or_varchar_columns` is enabled, when the maximum length of the char or varchar column in the schema of the hive table is inconsistent with the schema in the underlying parquet or orc file, it will be truncated according to the maximum length of the hive table column.

> The variable default is false.

## Query Hive partitions

You can query Hive partition information in the following two ways.

- `SHOW PARTITIONS FROM hive_table`

    This statement can list all partitions and partition value information of the specified Hive table.

- Use `table$partitions` metadata table

    Since versions 2.1.7 and 3.0.3, users can query Hive partition information through the `table$partitions` metadata table. `table$partitions` is essentially a relational table, so it can be used in any SELECT statement.

    ```
    SELECT * FROM hive_table$partitions;
    ```

## Access HMS with broker

Add following setting when creating an HMS catalog, file splitting and scanning for Hive external table will be completed by broker named `test_broker`

```sql
"broker.name" = "test_broker"
```

Doris has implemented Broker query support for HMS Catalog Iceberg based on the Iceberg `FileIO` interface. If needed, the following configuration can be added when creating the HMS Catalog.

```sql
"io-impl" = "org.apache.doris.datasource.iceberg.broker.IcebergBrokerIO"
```

## Integrate with Apache Ranger

Apache Ranger is a security framework for monitoring, enabling services, and comprehensive data security access management on the Hadoop platform.

Doris supports using Apache Ranger for authentication for a specified External Hive Catalog.

Currently, authentication of database, table, and column is supported. Functions such as encryption, row policy, and data masks are not currently supported.

To use Apache Ranger to authenticate the entire Doris cluster service, please refer to [Apache Ranger](../../admin-manual/auth/ranger.md)

### Settings

To connect to the Hive Metastore with Ranger permission verification enabled, you need to add configuration & configuration environment:

1. When creating a Catalog, add:

 ```sql
 "access_controller.properties.ranger.service.name" = "hive",
 "access_controller.class" = "org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory",
 ```

 > Note:
 >
 > `access_controller.properties.ranger.service.name` refers to the type of service, such as `hive`, `hdfs`, etc. It is not the value of `ranger.plugin.hive.service.name` in the configuration file.

2. Configure all FE environments:

    1. Copy the configuration files ranger-hive-audit.xml, ranger-hive-security.xml, and ranger-policymgr-ssl.xml under the HMS conf directory to the FE conf directory.

    2. Modify the properties of ranger-hive-security.xml, the reference configuration is as follows:

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

    3. In order to obtain the log of Ranger authentication itself, add the configuration file log4j.properties in the `<doris_home>/conf` directory.

    4. Restart FE.

### Best Practices

1. Create user user1 on the ranger side and authorize the query permission of db1.table1.col1

2. Create role role1 on the ranger side and authorize the query permission of db1.table1.col2

3. Create a user user1 with the same name in doris, user1 will directly have the query authority of db1.table1.col1

4. Create role1 with the same name in doris, and assign role1 to user1, user1 will have the query authority of db1.table1.col1 and col2 at the same time

5. The permissions of Admin and Root users are not controlled by Apache Ranger.

## Connect to Kerberos enabled Hive

This section mainly introduces how to connect to a Hive + HDFS cluster with Kerberos authentication enabled.

### Environment preparation

* `krb5.conf`

 `krb5.conf` is the configuration file for the Kerberos authentication protocol. This file needs to be deployed on all FE and BE nodes. And ensure that the Doris cluster can connect to the KDC service recorded in this file.

 By default, this file is located in the `/etc` directory of the Hadoop cluster. But please contact the Hadoop cluster administrator to obtain the correct `krb5.conf` file and deploy it to the `/etc` directory of all FE and BE nodes.

 Note that in some cases the file location of `krb5.conf` may depend on the environment variable `KRB5_CONFIG` or the `-Djava.security.krb5.conf` in the JVM parameters. Please check these properties to determine the exact location of `krb5.conf`.

 To customize the location of `krb5.conf`:
 
 - FE: Configure the JVM parameter `-Djava.security.krb5.conf` in `fe.conf`.
 - BE: Use the `kerberos_krb5_conf_path` configuration item in `be.conf`, the default value is `/etc/krb5.conf`.

* JVM parameters

 Please add the following options to the JVM of FE and BE (located in `fe.conf` and `be.conf`):

 	* `-Djavax.security.auth.useSubjectCredsOnly=false`
 	* `-Dsun.security.krb5.debug=true`

 And restart the FE and BE nodes to ensure it takes effect.

### Catalog configuration

Normally, to connect to a Kerberos enabled Hive cluster, you need to add the following attributes to the Catalog:

* `"hadoop.security.authentication" = "kerberos"`: Enable kerberos authentication method.
* `"hadoop.kerberos.principal" = "your_principal"`: The principal of the HDFS namenode. Typically the `dfs.namenode.kerberos.principal` configuration of `hdfs-site.xml`.
* `"hadoop.kerberos.keytab" = "/path/to/your_keytab"`: keytab file of HDFS namenode. Typically the `dfs.namenode.keytab.file` configuration of `hdfs-site.xml`. Note that this file needs to be deployed to the same directory of all FE and BE nodes (can be customized).
* `"yarn.resourcemanager.principal" = "your_principal"`: The principal of Yarn Resource Manager, which can be found in `yarn-site.xml`.
* `"hive.metastore.kerberos.principal" = "your_principal"`: The principal of the Hive metastore. Can be found in `hive-site.xml`.

> Note: Suggest to use `kinit -kt your_principal /path/to/your_keytab` 以及 `klist -k /path/to/your_keytab` to get the ticket or check its validation.

Examples are as follows:

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

### Multi-Kerberos Cluster Configuration

To access multiple Kerberos-enabled Hadoop clusters simultaneously, you need to modify the `krb5.conf` file and configure the `hadoop.security.auth_to_local` property. The detailed steps are as follows:

1. Configure Realms in the krb5.conf File

   When configuring multiple clusters, you need to include multiple realms in a single `krb5.conf` file. The KDC and admin_server can also be domain names.

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

2. Configure domain_realm in the krb5.conf File

   To locate the KDC, use the domain_name in the principal to find the corresponding realm.

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

   If not configured correctly, you may see domain_realm-related errors in the `log/be.out` or `log/fe.out` of Doris, such as:
    * Unable to locate KDC for realm / Cannot locate KDC
    * No service creds

3. Configure Domain-to-Realm Mapping

   To match principals used by different Kerberos services in a multi-cluster environment, it's recommended to add or modify the following configuration in `core-site.xml`:

    ```xml
    <property>
        <name>hadoop.security.auth_to_local</name>
        <value>RULE:[1:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
               RULE:[2:$1@$0](^.*@.*$)s/^(.*)@.*$/$1/g
               DEFAULT</value>
    </property>
    ```

   If it needs to take effect individually in the Catalog, it can be directly configured in the properties:

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

4. Restart Doris Service

    To verify whether the mapping rules match correctly, check if there are any errors such as `NoMatchingRule: No rules applied to user/domain_name@REALM.COM` when accessing different clusters.

### Troubleshooting

In case of Kerberos authentication problems, after setting the JVM parameter `-Dsun.security.krb5.debug=true`, Kerberos authentication related information will be printed in `fe.out` or `be.out`. You can refer to the related errors in [FAQ](../../faq/lakehouse-faq) for troubleshooting.

## Hive Transactional Tables

Hive transactional tables are tables in Hive that support ACID (Atomicity, Consistency, Isolation, Durability) semantics. For more details, you can refer to: [Hive Transactions](https://cwiki.apache.org/confluence/display/Hive/Hive+Transactions).

### Supported Operations for Hive Transactional Tables

|Transactional Table Type|Supported Operations in Hive|Hive Table Properties|Supported Hive Versions|
|---|---|---|---|
|Full-ACID Transactional Table |Supports insert, update, delete operations|'transactional'='true', 'transactional_properties'='insert_only'|3.x, 2.x (requires major compaction in Hive before loading)|
|Insert-Only Transactional Table|Supports only Insert operations|'transactional'='true'|3.x, 2.x|

### Current Limitations

Currently, it does not support scenarios involving Original Files.
When a table is transformed into a transactional table, subsequent newly written data files will use the schema of the Hive transactional table. However, existing data files will not be converted to the schema of the transactional table. These existing files are referred to as Original Files.

## Best Practices

- Handling of Empty Lines in Hive Text Format Tables

    By default, Doris ignores empty lines in Text format tables. Starting from version 2.1.5, you can control this behavior by setting the session variable `read_csv_empty_line_as_null`.

    `set read_csv_empty_line_as_null = true;`

    The variable defaults to false, indicating that empty lines are ignored. If set to true, the empty line will be read as a line with "all columns are null" and returned, which is consistent with the behavior of some query engines in the Hadoop ecosystem.
