---
{
  "title": "カタログ",
  "description": "CATALOGS()関数は、一時的なカタログtableを生成します。",
  "language": "ja"
}
---
## 説明

`CATALOGS()`関数は一時的な`catalogs`tableを生成し、現在のDorisインスタンスで作成されたすべてのカタログに関する情報を表示できます。結果は`show catalogs`と`show catalog xxx`の情報を組み合わせたものです。

この関数は`FROM`句で使用され、Dorisでのカタログデータのクエリと分析を簡単にします。

## 構文

```sql
CATALOGS()
```
## 戻り値
catalogs() 関数の戻りフィールドを確認する

```sql
desc function catalogs();
```
```text
+-------------+--------+------+-------+---------+-------+
| Field       | タイプ   | Null | Key   | Default | Extra |
+-------------+--------+------+-------+---------+-------+
| CatalogId   | BIGINT | No   | false | NULL    | NONE  |
| CatalogName | TEXT   | No   | false | NULL    | NONE  |
| CatalogType | TEXT   | No   | false | NULL    | NONE  |
| Property    | TEXT   | No   | false | NULL    | NONE  |
| Value       | TEXT   | No   | false | NULL    | NONE  |
+-------------+--------+------+-------+---------+-------+
```
フィールドの意味は以下の通りです：

| Field        | タイプ    | デスクリプション                                                                                                              |
|--------------|---------|--------------------------------------------------------------------------------------------------------------------------|
| `CatalogId`  | BIGINT  | 各カタログの一意識別子。異なるカタログを区別するために使用されます。                                      |
| `CatalogName`| TEXT    | カタログの名前。Doris内でのカタログの識別子です。                                            |
| `CatalogType`| TEXT    | カタログのタイプ（例：database、data source）。カタログの種類を示します。                                 |
| `Property`   | TEXT    | カタログに関連するプロパティの名前（例：設定項目）。                                           |
| `Value`      | TEXT    | カタログの対応するプロパティの値。カタログの設定に関する具体的な詳細を提供します。 |


## Examples
dorisクラスターのすべてのカタログ情報を表示

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
