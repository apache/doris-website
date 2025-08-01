---
{
    "title": "Hudi",
    "language": "en"
}
---

# Hudi

## Usage

1. Currently, Doris supports Snapshot Query on Copy-on-Write Hudi tables and Read Optimized Query on Merge-on-Read tables. In the future, it will support Snapshot Query on Merge-on-Read tables and Incremental Query.
2. Doris only supports Hive Metastore Catalogs currently. The usage is basically the same as that of Hive Catalogs. More types of Catalogs will be supported in future versions.

## Create Catalog

Same as creating Hive Catalogs. A simple example is provided here. See [Hive](./hive.md) for more information.

```sql
CREATE CATALOG hudi PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.21.0.1:7004',
    'hadoop.username' = 'hive',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:4007',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:4007',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

## Column Type Mapping

Same as that in Hive Catalogs. See the relevant section in [Hive](./hive.md).
