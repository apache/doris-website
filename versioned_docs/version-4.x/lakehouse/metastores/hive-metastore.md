---
{
    "title": "Hive Metastore",
    "language": "en",
    "description": "This document describes all supported parameters when connecting to and accessing Hive MetaStore services through the CREATE CATALOG statement."
}
---

This document describes all supported parameters when connecting to and accessing Hive MetaStore services through the `CREATE CATALOG` statement.

## Supported Catalog Types

| Catalog Type | Type Identifier (type) | Description                      |
| ------------ | ---------------------- | -------------------------------- |
| Hive         | hms                    | Catalog for connecting to Hive Metastore |
| Iceberg      | iceberg                | Catalog for Iceberg table format |
| Paimon       | paimon                 | Catalog for Apache Paimon table format |

## Common Parameters Overview

The following parameters are common to different Catalog types.

| Parameter Name                     | Former Name                       | Required | Default | Description                                                                                                                                                                              |
| ---------------------------------- | --------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hive.metastore.uris                |                                   | Yes      | None    | URI address of Hive Metastore, supports multiple URIs separated by commas. Example: 'hive.metastore.uris' = 'thrift://127.0.0.1:9083','hive.metastore.uris' = 'thrift://127.0.0.1:9083,thrift://127.0.0.1:9084' |
| hive.metastore.authentication.type | hadoop.security.authentication    | No       | simple  | Metastore authentication method: supports simple (default) or kerberos. In versions 3.0 and earlier, authentication method was determined by hadoop.security.authentication property. Starting from version 3.1, Hive Metastore authentication method can be specified separately. Example: 'hive.metastore.authentication.type' = 'kerberos' |
| hive.metastore.service.principal   | hive.metastore.kerberos.principal | No       | Empty   | Hive server principal, supports _HOST placeholder. Example: 'hive.metastore.service.principal' = 'hive/_HOST@EXAMPLE.COM'                                                               |
| hive.metastore.client.principal    | hadoop.kerberos.principal         | No       | Empty   | Kerberos principal used by Doris to connect to Hive MetaStore service.                                                                                                                  |
| hive.metastore.client.keytab       | hadoop.kerberos.keytab            | No       | Empty   | Kerberos keytab file path                                                                                                                                                               |
| hive.metastore.username            | hadoop.username                   | No       | hadoop  | Hive Metastore username, used in non-Kerberos mode                                                                                                                                      |
| hive.conf.resources                |                                   | No       | Empty   | hive-site.xml configuration file path, using relative path                                                                                                                             |
| hive.metastore.client.socket.timeout                |                                   | No    | Default value is `hive_metastore_client_timeout_second` in FE configuration parameters, defaults to 10 seconds. | This parameter is supported since version 4.0.3. Timeout for accessing metadata through Hive Metastore Client connection. If the metadata is large (e.g., when there are many partitions), this value can be increased. |

> Note:
>
> For versions before 3.1.0, please use the former names.

### Required Parameters

* `hive.metastore.uris`: Must specify the URI address of Hive Metastore

### Optional Parameters

* `hive.metastore.authentication.type`: Authentication method, default is `simple`, optional `kerberos`

* `hive.metastore.service.principal`: Kerberos principal of Hive MetaStore service, must be specified when using Kerberos authentication.

* `hive.metastore.client.principal`: Kerberos principal used by Doris to connect to Hive MetaStore service, must be specified when using Kerberos authentication.

* `hive.metastore.client.keytab`: Kerberos keytab file path, must be specified when using Kerberos authentication.

* `hive.metastore.username`: Username for connecting to Hive MetaStore service, used in non-Kerberos mode, default is `hadoop`.

* `hive.conf.resources`: hive-site.xml configuration file path, used when configuration for connecting to Hive Metastore service needs to be read from configuration files.

### Authentication Methods

#### Simple Authentication

* `simple`: Non-Kerberos mode, directly connects to Hive Metastore service.

#### Kerberos Authentication

To use Kerberos authentication to connect to Hive Metastore service, configure the following parameters:

* `hive.metastore.authentication.type`: Set to `kerberos`

* `hive.metastore.service.principal`: Kerberos principal of Hive MetaStore service

* `hive.metastore.client.principal`: Kerberos principal used by Doris to connect to Hive MetaStore service

* `hive.metastore.client.keytab`: Kerberos keytab file path

```sql
'hive.metastore.authentication.type' = 'kerberos',
'hive.metastore.service.principal' = 'hive/_HOST@EXAMPLE.COM',
'hive.metastore.client.principal' = 'hive/doris.cluster@EXAMPLE.COM',
'hive.metastore.client.keytab' = '/etc/security/keytabs/hive.keytab'
```

When using Hive MetaStore service with Kerberos authentication enabled, ensure that the same keytab file exists on all FE nodes, the user running the Doris process has read permission to the keytab file, and the krb5 configuration file is properly configured.

For detailed Kerberos configuration, refer to Kerberos Authentication.

### Configuration File Parameters

#### `hive.conf.resources`

If you need to read configuration for connecting to Hive Metastore service through configuration files, you can configure the `hive.conf.resources` parameter to set the conf file path.

> Note: The `hive.conf.resources` parameter only supports relative paths, do not use absolute paths. The default path is under the `${DORIS_HOME}/plugins/hadoop_conf/` directory. You can specify other directories by modifying hadoop_config_dir in fe.conf.

Example: `'hive.conf.resources' = 'hms-1/hive-site.xml'`

## Catalog Type-Specific Data

The following parameters are specific to each Catalog type, in addition to the common parameters.

### Hive Catalog

| Parameter Name      | Former Name | Required | Default | Description                                                          |
| ------------------- | ----------- | -------- | ------- | -------------------------------------------------------------------- |
| type                |             | Yes      | None    | Catalog type, fixed as hms for Hive Catalog                         |
| hive.metastore.type |             | No       | 'hms'   | Metadata Catalog type, fixed as hms for Hive Metastore, must be hms when using HiveMetaStore |

#### Examples

1. Create a Hive Catalog using unauthenticated Hive Metastore as metadata service, with S3 storage service.

   ```sql
   CREATE CATALOG hive_hms_s3_test_catalog PROPERTIES (
       'type' = 'hms',
       'hive.metastore.uris' = 'thrift://127.0.0.1:9383',
       's3.access_key' = 'S3_ACCESS_KEY',
       's3.secret_key' = 'S3_SECRET_KEY',
       's3.region' = 's3.ap-east-1.amazonaws.com'
   );
   ```

2. Create a Hive Catalog using Hive Metastore with Kerberos authentication enabled as metadata service, with S3 storage service.

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

| Parameter Name       | Former Name | Required | Default | Description                                                          |
| -------------------- | ----------- | -------- | ------- | -------------------------------------------------------------------- |
| type                 |             | Yes      | None    | Catalog type, fixed as iceberg for Iceberg                          |
| iceberg.catalog.type |             | No       | None    | Metadata Catalog type, fixed as hms for Hive Metastore, must be hms when using HiveMetaStore |
| warehouse            |             | No       | None    | Iceberg warehouse path                                               |

#### Examples

1. Create an Iceberg Catalog using Hive Metastore as metadata service, with S3 storage service.

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

2. Create an Iceberg Catalog using Hive Metastore with Kerberos authentication enabled as metadata service in a multi-Kerberos environment, with S3 storage service.

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

| Parameter Name      | Former Name | Required | Default    | Description                                                         |
| ------------------- | ----------- | -------- | ---------- | ------------------------------------------------------------------- |
| type                |             | Yes      | None       | Catalog type, fixed as paimon for Paimon                           |
| paimon.catalog.type |             | No       | filesystem | Must be hms when using HiveMetaStore, default is filesystem for storing metadata in filesystem |
| warehouse           |             | Yes      | None       | Paimon warehouse path                                               |

#### Examples

1. Create a Paimon Catalog using Hive Metastore as metadata service, with S3 storage service.

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

2. Create a Paimon Catalog using Hive Metastore with Kerberos authentication enabled as metadata service in a multi-Kerberos environment, with S3 storage service.

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
## HMS Access Port Requirements

Doris requires at least the following ports to be open to access HMS:

| Service        | Port Purpose          | Default Port | Protocol |
|----------------|-----------------------|--------------|----------|
| Hive Metastore | Thrift (metadata access) | 9083         | TCP      |

Notes:
- Ports may be customized in `hive-site.xml`. Always follow your actual configuration.
- When Kerberos authentication is enabled, ensure network connectivity from Doris to the Kerberos KDC. The KDC listens on TCP port 88 by default, unless customized in your KDC configuration.

## Frequently Asked Questions (FAQ)

- Q1: Is hive-site.xml mandatory?

    No, it's only used when configuration needs to be read from it.

- Q2: Must the keytab file exist on every node?

    Yes, all FE nodes must be able to access the specified path.

- Q3: What should be noted when using write-back functionality, i.e., creating Hive/Iceberg databases/tables in Doris?

    Since creating tables involves metadata operations on the storage side, i.e., accessing the storage system, the Hive MetaStore service server side needs to configure corresponding storage parameters, such as access parameters for S3, OSS and other storage services. When using object storage as the underlying storage system, ensure that the bucket being written to matches the configured Region.