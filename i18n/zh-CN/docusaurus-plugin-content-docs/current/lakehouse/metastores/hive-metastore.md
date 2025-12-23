---
{
    "title": "Hive Metastore",
    "language": "zh-CN",
    "description": "本文档用于介绍通过 CREATE CATALOG 语句连接并访问 Hive MetaStore 服务时支持的所有参数。"
}
---

本文档用于介绍通过 `CREATE CATALOG` 语句连接并访问 Hive MetaStore 服务时支持的所有参数。

## 支持的 Catalog 类型

| Catalog 类型 | 类型标识 (type) | 描述                          |
| ---------- | ----------- | --------------------------- |
| Hive       | hms         | 对接 Hive Metastore 的 Catalog |
| Iceberg    | iceberg     | 对接 Iceberg 表格式              |
| Paimon     | paimon      | 对接 Apache Paimon 表格式        |

## 通用参数总览

以下参数为不同 Catalog 类型的通用参数。

| 参数名称                               | 曾用名                               | 是否必须 | 默认值    | 简要描述                                                                                                                                                                                 |
| ---------------------------------- | --------------------------------- | ---- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| hive.metastore.uris                |                                   | 是    | 无      | Hive Metastore 的 URI 地址，支持多个逗号分隔，示例：'hive.metastore.uris' = 'thrift://127.0.0.1:9083','hive.metastore.uris' = 'thrift://127.0.0.1:9083,thrift://127.0.0.1:9084'                     |
| hive.metastore.authentication.type | hadoop.security.authentication    | 否    | simple | Metastore 认证方式：支持 simple（默认）或 kerberos，在 3.0 及之前版本中，认证方式由 hadoop.security.authentication 属性决定。3.1 版本开始，可以单独指定 Hive Metastore 的认证方式，示例：'hive.metastore.authentication.type' = 'kerberos' |
| hive.metastore.service.principal   | hive.metastore.kerberos.principal | 否    | 空      | Hive 服务端 principal，支持 \_HOST 占位符，示例：'hive.metastore.service.principal' = 'hive/<_HOST@EXAMPLE.COM>'                                                                                  |
| hive.metastore.client.principal    | hadoop.kerberos.principal         | 否    | 空      | Doris 连接到 Hive MetaStore 服务时使用的 Kerberos 主体。                                                                                                                                        |
| hive.metastore.client.keytab       | hadoop.kerberos.keytab            | 否    | 空      | Kerberos keytab 文件路径                                                                                                                                                                 |
| hive.metastore.username            | hadoop.username                   | 否    | hadoop | Hive Metastore 用户名，非 Kerberos 模式下使用                                                                                                                                                  |
| hive.conf.resources                |                                   | 否    | 空      | hive-site.xml 配置文件路径，使用相对路径                                                                                                                                                          |

> 注：
>
> 3.1.0 版本之前，请使用曾用名。

### 必填参数

* `hive.metastore.uris`：必须指定 Hive Metastore 的 URI 地址

### 可选参数

* `hive.metastore.authentication.type`：认证方式，默认为 `simple`，可选 `kerberos`

* `hive.metastore.service.principal`：Hive MetaStore 服务的 Kerberos 主体，当使用 Kerberos 认证时必须指定。

* `hive.metastore.client.principal`：Doris 连接到 Hive MetaStore 服务时使用的 Kerberos 主体，当使用 Kerberos 认证时必须指定。

* `hive.metastore.client.keytab`：Kerberos keytab 文件路径，当使用 Kerberos 认证时必须指定。

* `hive.metastore.username`：连接 Hive MetaStore 服务的用户名，非 Kerberos 模式下使用，默认为 `hadoop`。

* `hive.conf.resources`：hive-site.xml 配置文件路径，当需要通过配置文件的方式读取链接 Hive Metastore 服务的配置时使用。

### 认证方式

#### Simple 认证

* `simple`：非 Kerberos 模式，直接连接 Hive Metastore 服务。

#### Kerberos 认证

使用 Kerberos 认证连接 Hive Metastore 服务，需要配置以下参数：

* `hive.metastore.authentication.type`：设置为 `kerberos`

* `hive.metastore.service.principal`：Hive MetaStore 服务的 Kerberos 主体

* `hive.metastore.client.principal`：Doris 连接到 Hive MetaStore 服务时使用的 Kerberos 主体

* `hive.metastore.client.keytab`：Kerberos keytab 文件路径

```sql
'hive.metastore.authentication.type' = 'kerberos',
'hive.metastore.service.principal' = 'hive/_HOST@EXAMPLE.COM',
'hive.metastore.client.principal' = 'hive/doris.cluster@EXAMPLE.COM',
'hive.metastore.client.keytab' = '/etc/security/keytabs/hive.keytab'
```

使用开启 Kerberos 认证的 Hive MetaStore 服务时需要确保所有 FE 节点上都存在相同的 keytab 文件，并且运行 Doris 进程的用户具有该 keytab 文件的读权限。以及 krb5 配置文件配置正确。

Kerberos 详细配置参考 Kerberos 认证。

### 配置文件参数

#### `hive.conf.resources`

如需要通过配置文件的方式读取链接 Hive Metastore 服务的配置，可以配置 `hive.conf.resources` 参数来设置 conf 文件路径。

> 注意：`hive.conf.resources` 参数仅支持相对路径，请勿使用绝对路径。默认路径为 `${DORIS_HOME}/plugins/hadoop_conf/` 目录下。可通过修改 fe.conf 中的 hadoop\_config\_dir 来指定其他目录。

示例：`'hive.conf.resources' = 'hms-1/hive-site.xml'`

## Catalog 类型数据

以下参数是除通用参数外，各个 Catalog 特有的参数说明。

### Hive Catalog

| 参数名称                | 曾用名 | 是否必须 | 默认值   | 简要描述                                                                 |
| ------------------- | --- | ---- | ----- | -------------------------------------------------------------------- |
| type                |     | 是    | 无     | Catalog 类型，Hive Catalog 固定为 iceberg                                  |
| hive.metastore.type |     | 否    | 'hms' | Metadata Catalog 类型，Hive Metastore 固定为 hms，使用 HiveMetaStore 则必须为 hms |

#### 示例

1. 创建一个使用无认证的 Hive Metastore 作为元数据服务的 Hive Catalog，存储使用 S3 存储服务。

   ```sql
   CREATE CATALOG hive_hms_s3_test_catalog PROPERTIES (
       'type' = 'hms',
       'hive.metastore.uris' = 'thrift://127.0.0.1:9383',
       's3.access_key' = 'S3_ACCESS_KEY',
       's3.secret_key' = 'S3_SECRET_KEY',
       's3.region' = 's3.ap-east-1.amazonaws.com'
   );
   ```

2. 创建一个使用开启了 Kerberos 认证的 Hive Metastore 作为元数据服务的 Hive Catalog，存储使用 S3 存储服务。

   ```sql
    CREATE CATALOG hive_hms_on_oss_kerberos_new_catalog PROPERTIES (
       'type' = 'hms',
       'hive.metastore.uris' = 'thrift://127.0.0.1:9583',
       'hive.metastore.client.principal'='hive/presto-master.docker.cluster@LABS.TERADATA.COM',
       'hive.metastore.client.keytab' = '/mnt/keytabs/keytabs/hive-presto-master.keytab',
       'hive.metastore.service.principal' = 'hive/hadoop-master@LABS.TERADATA.COM',
       'hive.metastore.authentication.type'='kerberos',
       'hadoop.security.auth_to_local' = 'RULE:[2:\$1@\$0](.*@LABS.TERADATA.COM)s/@.*//
                          RULE:[2:\$1@\$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                          RULE:[2:\$1@\$0](.*@OTHERREALM.COM)s/@.*//
                          DEFAULT',
       'oss.access_key' = 'OSS_ACCESS_KEY',
       'oss.secret_key' = 'OSS_SECRET_KEY',
       'oss.endpoint' = 'oss-cn-beijing.aliyuncs.com'
   );
   ```

### Iceberg Catalog

| 参数名称                 | 曾用名 | 是否必须 | 默认值 | 简要描述                                                                 |
| -------------------- | --- | ---- | --- | -------------------------------------------------------------------- |
| type                 |     | 是    | 无   | Catalog 类型，Iceberg 固定为 iceberg                                       |
| iceberg.catalog.type |     | 否    | 无   | Metadata Catalog 类型，Hive Metastore 固定为 hms，使用 HiveMetaStore 则必须为 hms |
| warehouse            |     | 否    | 无   | Iceberg 仓库路径                                                         |

#### 示例

1. 创建一个使用 Hive Metastore 作为元数据服务的 Iceberg Catalog，存储使用 S3 存储服务。

	```sql
	 CREATE CATALOG iceberg_hms_s3_test_catalog PROPERTIES (
	    'type' = 'iceberg',
	    'iceberg.catalog.type' = 'hms',
	    'hive.metastore.uris' = 'thrift://127.0.0.1:9383',
	    'warehouse' = 's3://doris/iceberg_warehouse/',
	    's3.access_key' = 'S3_ACCESS_KEY',
	    's3.secret_key' = 'S3_SECRET_KEY',
	    's3.region' = 's3.ap-east-1.amazonaws.com'
	);
	```

* 创建一个使用开启了 Kerberos 认证的 Hive Metastore 作为元数据服务的 Iceberg Catalog，并且处于多 kerberos 环境下。存储使用 S3 存储服务。

	```sql
	CREATE CATALOG IF NOT EXISTS iceberg_hms_on_oss_kerberos_new_catalog PROPERTIES (
	    'type' = 'iceberg',
	    'iceberg.catalog.type' = 'hms',
	    'hive.metastore.uris' = 'thrift://127.0.0.1:9583',
	    'warehouse' = 'oss://doris/iceberg_warehouse/',
	    'hive.metastore.client.principal'='hive/presto-master.docker.cluster@LABS.TERADATA.COM',
	    'hive.metastore.client.keytab' = '/mnt/keytabs/keytabs/hive-presto-master.keytab',
	    'hive.metastore.service.principal' = 'hive/hadoop-master@LABS.TERADATA.COM',
	    'hive.metastore.authentication.type'='kerberos',
	    'hadoop.security.auth_to_local' = 'RULE:[2:\$1@\$0](.*@LABS.TERADATA.COM)s/@.*//
	                       RULE:[2:\$1@\$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
	                       RULE:[2:\$1@\$0](.*@OTHERREALM.COM)s/@.*//
	                       DEFAULT',
	    'oss.access_key' = 'OSS_ACCESS_KEY',
	    'oss.secret_key' = 'OSS_SECRET_KEY',
	    'oss.endpoint' = 'oss-cn-beijing.aliyuncs.com'
	);
	```

### Paimon Catalog

| 参数名称                | 曾用名 | 是否必须 | 默认值        | 简要描述                                                    |
| ------------------- | --- | ---- | ---------- | ------------------------------------------------------- |
| type                |     | 是    | 无          | Catalog 类型，Iceberg 固定为 iceberg                          |
| paimon.catalog.type |     | 否    | filesystem | 使用 HiveMetaStore 则必须为 hms，默认值为 filesystem, 即使用文件系统存储元数据 |
| warehouse           |     | 是    | 无          | Paimon 仓库路径                                             |

#### 示例

1. 创建一个使用 Hive Metastore 作为元数据服务的 Paimon Catalog，存储使用 S3 存储服务。

	```sql
	 CREATE CATALOG IF NOT EXISTS paimon_hms_s3_test_catalog PROPERTIES (
	    'type' = 'paimon',
	    'paimon.catalog.type' = 'hms',
	    'hive.metastore.uris' = 'thrift://127.0.0.1:9383',
	    'warehouse' = 's3://doris/paimon_warehouse/',
	    's3.access_key' = 'S3_ACCESS_KEY',
	    's3.secret_key' = 'S3_SECRET_KEY',
	    's3.region' = 's3.ap-east-1.amazonaws.com'
	);
	```

* 创建一个使用开启了 Kerberos 认证的 Hive Metastore 作为元数据服务的 Paimon Catalog，并且处于多 kerberos 环境下。存储使用 S3 存储服务。

	```sql
	 CREATE CATALOG IF NOT EXISTS paimon_hms_on_oss_kerberos_new_catalog PROPERTIES (
	    'type' = 'paimon',
	    'paimon.catalog.type' = 'hms',
	    'hive.metastore.uris' = 'thrift://127.0.0.1:9583',
	    'warehouse' = 's3://doris/iceberg_warehouse/',
	    'hive.metastore.client.principal'='hive/presto-master.docker.cluster@LABS.TERADATA.COM',
	    'hive.metastore.client.keytab' = '/mnt/keytabs/keytabs/hive-presto-master.keytab',
	    'hive.metastore.service.principal' = 'hive/hadoop-master@LABS.TERADATA.COM',
	    'hive.metastore.authentication.type'='kerberos',
	    'hadoop.security.auth_to_local' = 'RULE:[2:\$1@\$0](.*@LABS.TERADATA.COM)s/@.*//
	                       RULE:[2:\$1@\$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
	                       RULE:[2:\$1@\$0](.*@OTHERREALM.COM)s/@.*//
	                       DEFAULT',
	    'oss.access_key' = 'OSS_ACCESS_KEY',
	    'oss.secret_key' = 'OSS_SECRET_KEY',
	    'oss.endpoint' = 'oss-cn-beijing.aliyuncs.com'
	);
	```

## HMS 访问端口要求

说明：Doris 访问 HMS 最少需保证以下端口连通。

| 服务             | 端口用途              | 默认端口 | 协议           |
|----------------|-------------------|------|--------------|
| Hive Metastore | Thrift（元数据访问） | 9083 | TCP          |

注意：
- 端口可能被 `hive-site.xml`自定义，请以实际配置为准。
- 当启用 Kerberos 认证时，需要保证 Doris 到 Kerberos KDC 的网络连通。KDC 默认监听 TCP 88 端口，如有自定义请以实际配置为准。

## 常见问题 FAQ

- Q1: hive-site.xml 是必须的吗？

	不是，仅当需要从中读取链接配置时使用。

- Q2: keytab 文件是否必须每个节点都存在？

	是的，所有 FE 节点必须可访问指定路径。

- Q3: 如使用回写功能，即在 Doris 中创建 Hive/Iceberg 库/表，需要注意什么？

	由于创建表涉及到存储端的元数据操作，即需要访问存储系统，因此 Hive MetaStore 服务 Server 端需要配置对应存储参数，如 S3、OSS 等存储服务的访问参数。如使用对象存储作为底层存储系统，还需要确保写入的 bucket 与配置的 Region 一致。
