---
{
    "title": "CATALOGS",
    "language": "ko",
    "description": "CATALOGS() 함수는 임시 catalogs 테이블을 생성합니다."
}
---

## 설명 {#description}

`CATALOGS()` 함수는 임시 `catalogs` 테이블을 생성하여 현재 Doris 인스턴스에 생성된 모든 Catalog의 정보를 확인할 수 있게 합니다. 결과에는 `show catalogs`와 `show catalog xxx`의 정보가 결합되어 있습니다.

이 함수는 `FROM` 절에서 사용하며, Doris에서 Catalog 데이터를 더 쉽게 쿼리하고 분석할 수 있게 합니다.

## 구문 {#syntax}
```sql
CATALOGS()
```

## 반환 값 {#return-value}
catalogs() 함수가 반환하는 필드를 확인합니다.
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

각 필드의 의미는 다음과 같습니다.

| 필드         | 유형    | 설명                                                                                                                     |
|--------------|---------|--------------------------------------------------------------------------------------------------------------------------|
| `CatalogId`  | BIGINT  | 각 Catalog의 고유 식별자입니다. 서로 다른 Catalog를 구분하는 데 사용됩니다.                                                |
| `CatalogName`| TEXT    | Catalog의 이름입니다. Doris 내에서 Catalog를 식별하는 데 사용됩니다.                                                      |
| `CatalogType`| TEXT    | Catalog의 유형(예: 데이터베이스, 데이터 소스)입니다. Catalog의 종류를 나타냅니다.                                          |
| `Property`   | TEXT    | Catalog와 관련된 속성의 이름(예: 구성 설정)입니다.                                                                         |
| `Value`      | TEXT    | Catalog의 해당 속성 값입니다. Catalog 구성에 대한 구체적인 정보를 제공합니다.                                             |


## 예제 {#examples}
Doris 클러스터의 모든 Catalog 정보를 확인합니다.
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
