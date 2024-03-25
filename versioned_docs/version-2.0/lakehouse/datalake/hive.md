---
{
    "title": "Hive",
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

# Hive

By connecting to Hive Metastore, Doris can automatically obtain database and table information from Hive and perform data queries.

In addition to Hive, systems like Iceberg and Hudi also use Hive Metastore for metadata storage. Hive Catalog in Doris allows users to easily integrate with not only Hive but also systems that use Hive Metastore as metadata storage.

## Note

- Hive 1, Hive 2, and Hive 3 are supported.
- Managed Tables, External Tables, and part of the Hive Views are supported.
- It can recognize Hive, Iceberg, and Hudi metadata stored in the Hive Metastore.
- You should place core-site.xml, hdfs-site.xml, and hive-site.xml in the conf directory of both FE and BE. During reading, the hadoop configuration files in the conf directory are read first, followed by the configuration files related to the HADOOP_CONF_DIR environment variable.

## Create Catalog

### Hive on HDFS

```SQL
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

In addition to the two required parameters of `type` and `hive.metastore.uris`, you can specify more parameters to pass the required information for the connection.

Example to provide HDFS HA information:

```SQL
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

### Hive on VIEWFS

```SQL
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

You can add viewfs-related parameters to the catalog configuration as above, or add them to `conf/core-site.xml`.

For details about how viewfs works and the parameter configurations, please refer to relevant hadoop documents, such as https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/ViewFs.html

### Hive on JuiceFS

Example for data stored on JuiceFS:

(You should put `juicefs-hadoop-x.x.x.jar` under `fe/lib/` and `apache_hdfs_broker/lib/`.)

```SQL
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hadoop.username' = 'root',
    'fs.jfs.impl' = 'io.juicefs.JuiceFileSystem',
    'fs.AbstractFileSystem.jfs.impl' = 'io.juicefs.JuiceFS',
    'juicefs.meta' = 'xxx'
);
```

### Hive on S3

```SQL
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

Optional properties:

- s3.connection.maximum: defaults to 50
- s3.connection.request.timeout: defaults to 3000ms
- s3.connection.timeout: defaults to 1000ms

### Hive on OSS

```SQL
CREATE CATALOG hive PROPERTIES (
    "type"="hms",
    "hive.metastore.uris" = "thrift://172.0.0.1:9083",
    "oss.endpoint" = "oss.oss-cn-beijing.aliyuncs.com",
    "oss.access_key" = "ak",
    "oss.secret_key" = "sk"
);
```

### Hive on OBS

```SQL
CREATE CATALOG hive PROPERTIES (
    "type"="hms",
    "hive.metastore.uris" = "thrift://172.0.0.1:9083",
    "obs.endpoint" = "obs.cn-north-4.myhuaweicloud.com",
    "obs.access_key" = "ak",
    "obs.secret_key" = "sk"
);
```

### Hive on COS

```SQL
CREATE CATALOG hive PROPERTIES (
    "type"="hms",
    "hive.metastore.uris" = "thrift://172.0.0.1:9083",
    "cos.endpoint" = "cos.ap-beijing.myqcloud.com",
    "cos.access_key" = "ak",
    "cos.secret_key" = "sk"
);
```

### Hive with AWS Glue

:::tip
When connecting to Glue, if you are in a non-EC2 environment, you need to copy the `~/.aws` directory from the EC2 environment to your current environment. Alternatively, you can download the AWS [CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) tool for configuration, which will also create the `.aws` directory in the current user's home directory.
:::

Access to AWS services with Doris supports two authentication methods.

**Authentication using Catalog properties**

You can fill in the basic properties of credentials, such as:

- When accessing S3, you can use `s3.endpoint`, `s3.access_key`, `s3.secret_key`.
- When accessing Glue, you can use `glue.endpoint`, `glue.access_key`, `glue.secret_key`.

For example, if you are accessing Glue using Iceberg Catalog, you can fill in the following properties to access tables hosted on Glue:

```SQL
CREATE CATALOG hive PROPERTIES (
    "type"="hms",
    "hive.metastore.type" = "glue",
    "glue.endpoint" = "https://glue.us-east-1.amazonaws.com",
    "glue.access_key" = "ak",
    "glue.secret_key" = "sk"
);
```

**Authentication using system properties**

This authentication method is used for applications running on AWS resources such as EC2 instances. It avoids hard-coding credentials and enhances data security.

If you create a Catalog without filling in the Credentials properties, the DefaultAWSCredentialsProviderChain will be used by default. It can read properties configured in system environment variables or instance profiles.

For configurations of environment variables and system properties, refer to [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html).

- Optional environment variables include: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AWS_ROLE_ARN`, `AWS_WEB_IDENTITY_TOKEN_FILE`, etc.
- You can follow [AWS Configure](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) to directly configure the Credentials information, which will generate a credentials file in the `~/.aws` directory.

## Metadata Cache & Refresh

For Hive Catalog, Doris caches 4 types of metadata:

- Table schema: table column information, etc.
- Partition value: partition value information of all partitions in a table.
- Partition information: information of each partition, such as partition data format, partition storage location, partition value, etc.
- File information: file information corresponding to each partition, such as file path location, etc.

The above cached information will not be persisted to Doris, so operations such as restarting Doris FE node, switching to masters may invalidate the cache. If the cache expires, Doris will directly access the Hive MetaStore to obtain information and refill the cache.

Metadata cache can be updated automatically, manually, or configured with TTL (Time-to-Live).

### Default behavior and TTL

By default, the metadata cache expires 10 minutes after it is first accessed. The TTL is determined by the configuration parameter `external_cache_expire_time_minutes_after_access` in fe.conf. (Note that in versions 2.0.1 and earlier, the default value for this parameter was 1 day).

For example, if the user accesses the metadata of table A for the first time at 10:00, then the metadata will be cached and will automatically expire after 10:10. If the user accesses the same metadata again at 10:11, Doris will directly access the Hive MetaStore to obtain information and refill the cache.

`external_cache_expire_time_minutes_after_access` affects all 4 caches under Catalog.

For the `INSERT INTO OVERWRITE PARTITION` operation commonly used in Hive, you can also timely update the `File Information Cache` by configuring the TTL of the `File Information Cache`:

```Plain
CREATE CATALOG hive PROPERTIES (
     'type'='hms',
     'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
     'file.meta.cache.ttl-second' = '60'
);
```

In the above example, `file.meta.cache.ttl-second` is set to 60 seconds, and the cache will expire after 60 seconds. This parameter will only affect the `file information cache`.

You can also set this value to 0 to disable file caching, which will fetch file information directly from the Hive MetaStore every time.

### Manual refresh

Users need to manually refresh the metadata through the [REFRESH](../../sql-manual/sql-reference/Utility-Statements/REFRESH.md) command.

**REFRESH CATALOG: Refresh the specified Catalog.**

```Shell
REFRESH CATALOG ctl1 PROPERTIES("invalid_cache" = "true");
```

- This command refreshes the database list, table list, and all cached information of the specified Catalog.
- `invalid_cache` indicates whether to refresh the cache. It defaults to true. If it is false, it will only refresh the database and table list of the catalog, but not the cached information. This parameter is applicable when the user only wants to synchronize newly added or deleted database/table information.

**REFRESH DATABASE: Refresh the specified Database.**

```Shell
REFRESH DATABASE [ctl.]db1 PROPERTIES("invalid_cache" = "true"); 
```

- This command refreshes the table list of the specified database and all cached information under the database.
- `invalid_cache` indicates the same as above. It defaults to true. If false, it will only refresh the table list of the database, but not the cached information. This parameter is applicable when the user only wants to synchronize newly added or deleted table information.

**REFRESH TABLE: Refresh the specified Table.**

```Shell
REFRESH TABLE [ctl.][db.]tbl1; 
```

- This command refreshes all cached information under the specified table.

### Regular refresh

Users can schedule the refresh for a Catalog when creating the Catalog.

```Plain
CREATE CATALOG hive PROPERTIES (
     'type'='hms',
     'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
     'metadata_refresh_interval_sec' = '600'
);
```

In the above example, `metadata_refresh_interval_sec` means refreshing the Catalog every 600 seconds, which means the following command will be executed automatically every 600 seconds:

```
REFRESH CATALOG ctl1 PROPERTIES("invalid_cache" = "true");
```

Note that the scheduled refresh interval must not be less than 5 seconds.

### Auto refresh

Currently, Doris only supports automatic update of metadata in Hive Metastore (HMS). It perceives changes in metadata by the FE node which regularly reads the notification events from HMS. The supported events are as follows:

| Event           | Corresponding Update Operation                               |
| --------------- | ------------------------------------------------------------ |
| CREATE DATABASE | Create a database in the corresponding catalog.              |
| DROP DATABASE   | Delete a database in the corresponding catalog.              |
| ALTER DATABASE  | Such alterations mainly include changes in properties, comments, or storage location of databases. They do not affect Doris' queries in External Catalogs. |
| CREATE TABLE    | Create a table in the corresponding database.                |
| DROP TABLE      | Delete a table in the corresponding database, and invalidate the cache of that table. |
| ALTER TABLE     | If it is renaming, delete the table of the old name, and then create a new table with the new name; otherwise, invalidate the cache of that table. |
| ADD PARTITION   | Add a partition to the cached partition list of the corresponding table. |
| DROP PARTITION  | Delete a partition from the cached partition list of the corresponding table, and invalidate the cache of that partition. |
| ALTER PARTITION | If it is a renaming, delete the partition of the old name, and then create a new partition with the new name; otherwise, invalidate the cache of that partition. |

After data ingestion, changes in partition tables will follow the `ALTER PARTITION` logic, while those in non-partition tables will follow the `ALTER TABLE` logic.

If changes are conducted on the file system directly instead of through the HMS, the HMS will not generate an event. As a result, such changes will not be perceived by Doris.

The automatic update feature involves the following parameters in fe.conf:

- `enable_hms_events_incremental_sync`: This specifies whether to enable automatic incremental synchronization for metadata, which is disabled by default. 
- `hms_events_polling_interval_ms`: This specifies the interval between two readings, which is set to 10000 by default. (Unit: millisecond) 
- `hms_events_batch_size_per_rpc`: This specifies the maximum number of events that are read at a time, which is set to 500 by default.

To enable automatic update(Excluding Huawei MRS), you need to modify the hive-site.xml of HMS and then restart HMS and HiveServer2:

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

For Huawei MRS, you need to change hivemetastore-site.xml and restart HMS and HiveServer2:

```Plain
<property>
    <name>metastore.transactional.event.listeners</name>
    <value>org.apache.hive.hcatalog.listener.DbNotificationListener</value>
</property>
```

## Hive Version

Doris can correctly access the Hive Metastore in different Hive versions. By default, Doris will access the Hive Metastore with a Hive 2.3 compatible interface. If you encounter the `Invalid method name: 'get_table_req'` error during queries, the root cause is Hive version incompatibility.

You can specify the Hive version when creating the Catalog. For example, to access Hive 1.1.0 version:

```Plain
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hive.version' = '1.1.0'
);
```

## Column type mapping

For Hive/Iceberge/Hudi

| HMS Type                                | Doris Type                              | Comment                                                                               |
| --------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------- |
| boolean                                 | boolean                                 |                                                                                       |
| tinyint                                 | tinyint                                 |                                                                                       |
| smallint                                | smallint                                |                                                                                       |
| int                                     | int                                     |                                                                                       |
| bigint                                  | bigint                                  |                                                                                       |
| date                                    | date                                    |                                                                                       |
| timestamp                               | datetime                                |                                                                                       |
| float                                   | float                                   |                                                                                       |
| double                                  | double                                  |                                                                                       |
| char                                    | char                                    |                                                                                       |
| varchar                                 | varchar                                 |                                                                                       |
| decimal                                 | decimal                                 |                                                                                       |
| `array<type>`                           | `array<type>`                           | Supports nested structure, such as `array<map<string, int>>`                          |
| `map<KeyType, ValueType>`               | `map<KeyType, ValueType>`               | Supports nested structure, such as `map<string, array<int>>`                          |
| `struct<col1: Type1, col2: Type2, ...>` | `struct<col1: Type1, col2: Type2, ...>` | Supports nested structure, such as `struct<col1: array<int>`, `col2: map<int, date>>` |
| other                                   | unsupported                             |                                                                                       |

:::tip
**Truncate char or varchar columns**

If `truncate_char_or_varchar_columns` is enabled, and the maximum length of the char or varchar column in the schema of the hive table is inconsistent with the schema in the underlying Parquet or ORC file, the columns will be truncated according to the maximum length of the hive table column.

The variable defaults to false.
:::

## Access HMS with broker

Add the following setting when creating an HMS catalog, file splitting and scanning for Hive external table will be completed by the broker named `test_broker`.

```SQL
"broker.name" = "test_broker"
```

Doris supports querying HMS Catalog Iceberg by implementing the Iceberg FileIO interface in the Broker. If needed, you can add the following configuration when creating an HMS Catalog.

```SQL
"io-impl" = "org.apache.doris.datasource.iceberg.broker.IcebergBrokerIO"
```

## Integrate with Apache Ranger

Apache Ranger is a security framework for monitoring, enabling services, and comprehensive data security access management on the Hadoop platform.

Doris supports authentication on specified External Hive Catalog using Apache Ranger.

Currently Doris supports authentication of Ranger libraries, tables, and columns, but does not support encryption, row privileges, and Data Mask.

If you need to use Apache Ranger for authentication of the entire Doris cluster, refer to [Integration with Apache Ranger](https://doris.apache.org/docs/dev/admin-manual/privilege-ldap/ranger/).

### Environment settings

To connect to the Hive Metastore with Ranger authentication enabled, you need to add configurations and environment settings as follows:

1. When creating a Catalog, add:

```SQL
"access_controller.properties.ranger.service.name" = "hive",
"access_controller.class" = "org.apache.doris.catalog.authorizer.RangerHiveAccessControllerFactory",
```

:::note
 `access_controller.properties.ranger.service.name` refers to the type of service, such as `hive`, `hdfs`, etc. It does not correspond to the value of `ranger.plugin.hive.service.name` in the configuration file.
:::

2. Configure all FE environments:

a. Copy the configuration files ranger-hive-audit.xml, ranger-hive-security.xml, and ranger-policymgr-ssl.xml under the HMS conf directory to the FE conf directory.

b. Modify the properties in ranger-hive-security.xml, an example is as follows: 

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

c. In order to obtain the logs of Ranger authentication, add the configuration file log4j.properties in the `<doris_home>/conf` directory.

d. Restart FE.

### Best Practice

1. Create `user1` on the Ranger side and authorize the query permission of db1.table1.col1
2. Create `role1` on the Ranger side and authorize the query permission of db1.table1.col2
3. Create the same `user1` in Doris, `user1` will be directly granted with the query permission of db1.table1.col1
4. Create the same `role1` in Doris, and assign `role1` to `user1`. `user1` will be directly granted with the query permission of db1.table1.col1 and col2 at the same time.
5. The Admin and Root privileges of Doris are not impacted by Apache Ranger.

## Authentication with Kerberos

Kerberos is an authentication protocol designed to provide strong identity verification for applications through the use of encryption with private keys.

### Environment settings

1. When the services in the cluster are configured with Kerberos authentication, the relevant authentication information is needed in Hive Catalog configuration.

- `hadoop.kerberos.keytab`: the principal required for authentication. It should be the same as the keytab in the Doris cluster.
- `hadoop.kerberos.principal`: Find the corresponding principal for the hostname in the Doris cluster, such as `doris/``hostname@HADOOP.COM`, and verify with `klist -kt` using the keytab.
- `yarn.resourcemanager.principal`: Go to the Yarn Resource Manager node and retrieve this from `yarn-site.xml`. Verify the keytab of Yarn with `klist -kt`.
- `hive.metastore.kerberos.principal`: Go to the Hive metadata service node and retrieve this from `hive-site.xml`. Verify the keytab of Hive with `klist -kt`.
- `hadoop.security.authentication`: Enable Hadoop Kerberos authentication.

Place the `krb5.conf` file and `keytab` authentication file on all BE and FE nodes. Ensure consistencyt of the path of the `keytab` authentication file. By default, the `krb5.conf` file is placed in the `/etc/krb5.conf` path. Also, confirm that the JVM parameter `-Djava.security.krb5.conf` and the environment variable `KRB5_CONFIG`point to the correct path of the `krb5.conf` file.

2. After the configuration is completed, if you cannot locate the issue in the FE and BE logs, you can enable Kerberos debugging.

- On all FE and BE nodes, locate the `conf/fe.conf` and `conf/be.conf` files in the deployment path.
- After finding the configuration files, set the JVM parameter `-Dsun.security.krb5.debug=true` in the `JAVA_OPTS` variable to enable Kerberos debugging.
- The FE Kerberos authentication debug information can be found in the FE log path `log/fe.out`, and the BE Kerberos authentication debug information can be found in the BE log path `log/be.out`.
- For solutions to more common issues, refer to [FAQ](https://doris.apache.org/docs/dev/lakehouse/faq/).

### Best practice

Example:

```SQL
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

Example of HDFS HA information and Kerberos authentication information:

```SQL
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

## Hive transactional table

Hive transactional tables are tables that support ACID semantics in Hive. For more details, see: https://cwiki.apache.org/confluence/display/Hive/Hive+Transactions

### Support for Hive transactional tables

| Table Type                      | Supported Operations in Hive               | Hive Table Properties                                        | Supported Hive Versions                                      |
| ------------------------------- | ------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Full-ACID Transactional Table   | Supports Insert, Update, Delete operations | 'transactional'='true', 'transactional_properties'='insert_only' | 3.x, 2.x. In 2.x, loading can only be performed after major compaction is executed in Hive. |
| Insert-Only Transactional Table | Only supports Insert operations            | 'transactional'='true'                                       | 3.x，2.x                                                     |

### Current restrictions

Currently, scenarios involving Original Files are not supported. After a table is converted into a transactional table, subsequent newly written data files will follow the schema of Hive Transactional table. However, existing data files will not be converted to the schema of the Transactional table. These files are referred to as Original Files.
