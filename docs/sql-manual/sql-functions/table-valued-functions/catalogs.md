---
{
    "title": "CATALOGS",
    "language": "en",
    "description": "The CATALOGS() function generates a temporary catalogs table,"
}
---

## Description

The `CATALOGS()` function generates a temporary `catalogs` table, allowing you to view information about all the catalogs created in the current Doris instance. The result combines the information from `show catalogs` and `show catalog xxx`.

This function is used in the `FROM` clause, making it easier to query and analyze catalog data in Doris.

## Syntax
```sql
CATALOGS()
```

## Return Value
View the returned fields of the catalogs() function
```sql
desc function catalogs();
```
```text
+-------------+--------+------+-------+---------+-------+
| Field       | Type   | Null | Key   | Default | Extra |
+-------------+--------+------+-------+---------+-------+
| CatalogId   | BIGINT | No   | false | NULL    | NONE  |
| CatalogName | TEXT   | No   | false | NULL    | NONE  |
| CatalogType | TEXT   | No   | false | NULL    | NONE  |
| Property    | TEXT   | No   | false | NULL    | NONE  |
| Value       | TEXT   | No   | false | NULL    | NONE  |
+-------------+--------+------+-------+---------+-------+
```

The field meanings are as follows:

| Field        | Type    | Description                                                                                                              |
|--------------|---------|--------------------------------------------------------------------------------------------------------------------------|
| `CatalogId`  | BIGINT  | A unique identifier for each catalog. It is used to distinguish different catalogs.                                      |
| `CatalogName`| TEXT    | The name of the catalog. This is the identifier for the catalog within Doris.                                            |
| `CatalogType`| TEXT    | The type of the catalog (e.g., database, data source). It indicates the kind of catalog.                                 |
| `Property`   | TEXT    | The name of a property related to the catalog (e.g., a configuration setting).                                           |
| `Value`      | TEXT    | The value of the corresponding property for the catalog. It provides specific details about the catalog's configuration. |


## Examples
View all catalog information of the doris cluster
```sql
select * from catalogs()
```
```text
+-----------+-------------+-------------+--------------------------------------------+---------------------------------------------------------------------------+
| CatalogId | CatalogName | CatalogType | Property                                   | Value                                                                     |
+-----------+-------------+-------------+--------------------------------------------+---------------------------------------------------------------------------+
|     16725 | hive        | hms         | dfs.client.failover.proxy.provider.HANN    | org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider |
|     16725 | hive        | hms         | dfs.ha.namenodes.HANN                      | nn1,nn2                                                                   |
|     16725 | hive        | hms         | create_time                                | 2023-07-13 16:24:38.968                                                   |
|     16725 | hive        | hms         | ipc.client.fallback-to-simple-auth-allowed | true                                                                      |
|     16725 | hive        | hms         | dfs.namenode.rpc-address.HANN.nn1          | nn1_host:rpc_port                                                         |
|     16725 | hive        | hms         | hive.metastore.uris                        | thrift://127.0.0.1:7004                                                   |
|     16725 | hive        | hms         | dfs.namenode.rpc-address.HANN.nn2          | nn2_host:rpc_port                                                         |
|     16725 | hive        | hms         | type                                       | hms                                                                       |
|     16725 | hive        | hms         | dfs.nameservices                           | HANN                                                                      |
|         0 | internal    | internal    | NULL                                       | NULL                                                                      |
|     16726 | es          | es          | create_time                                | 2023-07-13 16:24:44.922                                                   |
|     16726 | es          | es          | type                                       | es                                                                        |
|     16726 | es          | es          | hosts                                      | http://127.0.0.1:9200                                                     |
+-----------+-------------+-------------+--------------------------------------------+---------------------------------------------------------------------------+
```
