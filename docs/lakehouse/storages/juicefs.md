---
{
    "title": "JuiceFS | Storages",
    "language": "en",
    "description": "This document describes the parameters required for accessing JuiceFS. These parameters apply to:",
    "sidebar_label": "JuiceFS"
}
---

# JuiceFS

:::tip Supported since
Doris 4.0.2
:::

[JuiceFS](https://juicefs.com) is an open-source, high-performance distributed file system designed for the cloud. It is fully compatible with the HDFS API. Doris treats the `jfs://` scheme as HDFS-compatible, so you can access data stored in JuiceFS using the same approach as HDFS.

This document describes the parameters required for accessing JuiceFS. These parameters apply to:

* Catalog properties
* Table Valued Function properties
* Broker Load properties
* Export properties
* Outfile properties

## Prerequisites

JuiceFS access relies on the `juicefs-hadoop` client jar. Starting from Doris 4.0.2, the build system automatically downloads and packages this jar. The jar is placed under:

- FE: `fe/lib/juicefs/`
- BE: `be/lib/java_extensions/juicefs/`

If you are deploying manually, download the `juicefs-hadoop-<version>.jar` from [Maven Central](https://repo1.maven.org/maven2/io/juicefs/juicefs-hadoop/) and place it in the directories listed above.

## Parameter Overview

Since JuiceFS is HDFS-compatible, it shares the same authentication parameters as HDFS. Additionally, the following JuiceFS-specific parameters are available:

| Property Name | Description | Required |
| --- | --- | --- |
| fs.defaultFS | The default filesystem URI, for example `jfs://cluster`. | Yes |
| fs.jfs.impl | The Hadoop FileSystem implementation class. Must be set to `io.juicefs.JuiceFileSystem`. | Yes |
| juicefs.\<cluster\>.meta | The JuiceFS metadata engine endpoint, for example `redis://127.0.0.1:6379/1` or `mysql://user:pwd@(host:port)/db`. Replace `<cluster>` with the cluster name in your `fs.defaultFS` URI. | Yes |

For HDFS authentication parameters (Simple or Kerberos), refer to the [HDFS](./hdfs.md) documentation.

All properties prefixed with `juicefs.` will be passed through to the underlying JuiceFS Hadoop client.

## Example Configurations

### Catalog with Hive Metastore

```sql
CREATE CATALOG jfs_hive PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://<hms_host>:9083',
    'fs.defaultFS' = 'jfs://cluster',
    'fs.jfs.impl' = 'io.juicefs.JuiceFileSystem',
    'juicefs.cluster.meta' = 'redis://127.0.0.1:6379/1',
    'hadoop.username' = 'doris'
);
```

### Broker Load

```sql
LOAD LABEL example_db.label1
(
    DATA INFILE("jfs://cluster/path/to/data/*")
    INTO TABLE `my_table`
)
WITH BROKER
(
    "fs.defaultFS" = "jfs://cluster",
    "fs.jfs.impl" = "io.juicefs.JuiceFileSystem",
    "juicefs.cluster.meta" = "redis://127.0.0.1:6379/1",
    "hadoop.username" = "doris"
);
```

### Table Valued Function

```sql
SELECT * FROM TABLE(
    "uri" = "jfs://cluster/path/to/file.parquet",
    "format" = "parquet",
    "fs.jfs.impl" = "io.juicefs.JuiceFileSystem",
    "juicefs.cluster.meta" = "redis://127.0.0.1:6379/1"
);
```

## Best Practices

* Ensure the `juicefs-hadoop` jar is deployed on **all** FE and BE nodes.
* The `juicefs.<cluster>.meta` property must match the cluster name in the `jfs://` URI. For example, if `fs.defaultFS = jfs://mycluster`, the metadata property should be `juicefs.mycluster.meta`.
* JuiceFS supports multiple metadata engines (Redis, MySQL, TiKV, SQLite, etc.). Choose based on your scale and availability requirements.
* HDFS configurations such as Kerberos authentication, HA nameservice settings, and Hadoop config files are all compatible with JuiceFS.
