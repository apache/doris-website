---
{
    "title": "CATALOGS",
    "language": "ja",
    "description": "CATALOGS() 関数は一時的な catalogs テーブルを生成します。"
}
---

## 説明

`CATALOGS()` 関数は一時的な `catalogs` テーブルを生成し、現在の Doris インスタンスに作成されているすべてのカタログの情報を表示します。結果には `show catalogs` と `show catalog xxx` の情報が組み合わされます。

この関数は `FROM` 句で使用し、Doris のカタログデータを簡単にクエリおよび分析できます。

## 構文
```sql
CATALOGS()
```

## 戻り値
catalogs() 関数が返すフィールドを確認します。
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

各フィールドの意味は次のとおりです。

| フィールド   | 型      | 説明                                                                                                                       |
|--------------|---------|----------------------------------------------------------------------------------------------------------------------------|
| `CatalogId`  | BIGINT  | 各カタログを一意に識別する ID です。異なるカタログを区別するために使用します。                                                |
| `CatalogName`| TEXT    | カタログの名前です。Doris 内でカタログを識別するために使用します。                                                             |
| `CatalogType`| TEXT    | カタログの種類（データベース、データソースなど）です。カタログがどの種類に属するかを示します。                                  |
| `Property`   | TEXT    | カタログに関連するプロパティ（設定項目など）の名前です。                                                                       |
| `Value`      | TEXT    | 対応するカタログのプロパティの値です。カタログの設定に関する具体的な情報を示します。                                             |


## 例
Doris クラスターのすべてのカタログ情報を表示します。
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
