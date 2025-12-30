---
{
    "title": "CATALOGS",
    "language": "zh-CN",
    "description": "CATALOGS() 函数生成一个临时的 catalogs 表，允许查看当前 Doris 中所有已创建的 catalogs 信息，其结果综合了 show catalogs 和 show catalog xxx 的信息。"
}
---

## 描述

`CATALOGS()` 函数生成一个临时的 catalogs 表，允许查看当前 Doris 中所有已创建的 catalogs 信息，其结果综合了 `show catalogs` 和 `show catalog xxx` 的信息。

该函数用于 FROM 子句中，便于查询和分析 Doris 中的 catalog 数据。

## 语法
```sql
CATALOGS()
```

## 返回值
查看 catalog() 函数的描述字段
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

字段含义如下：

| 字段名称        | 类型       | 说明                                                        | 
|-----------------|----------|-----------------------------------------------------------| 
| `CatalogId`     | BIGINT   | Catalog 的唯一标识符，用于区分不同的 catalog 实例。                        | 
| `CatalogName`   | TEXT     | Catalog 的名称，用于标识 Doris 中的 catalog。                        | 
| `CatalogType`   | TEXT     | Catalog 的类型，例如 `hms`（Hive Metastore）、`es`（Elasticsearch）。 | 
| `Property`      | TEXT     | 与 catalog 相关的属性名称或配置项。                                    | 
| `Value`         | TEXT     | 属性的值，描述 catalog 配置的具体内容。                                  |

## 示例
查看 doris 集群所有 catalog 信息
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