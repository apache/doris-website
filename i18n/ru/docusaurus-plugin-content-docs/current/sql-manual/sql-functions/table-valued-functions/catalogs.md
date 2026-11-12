---
{
    "title": "CATALOGS",
    "language": "ru",
    "description": "Функция CATALOGS() создаёт временную таблицу catalogs,"
}
---

## Описание {#description}

Функция `CATALOGS()` создаёт временную таблицу `catalogs`, которая позволяет просматривать сведения обо всех объектах Catalog, созданных в текущем экземпляре Doris. Результат объединяет сведения из `show catalogs` и `show catalog xxx`.

Эта функция используется в предложении `FROM`, упрощая выполнение запросов к данным объектов Catalog и их анализ в Doris.

## Синтаксис {#syntax}
```sql
CATALOGS()
```

## Возвращаемое значение {#return-value}
Просмотр полей, возвращаемых функцией catalogs()
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

Назначение полей приведено ниже:

| Поле         | Тип     | Описание                                                                                                              |
|--------------|---------|--------------------------------------------------------------------------------------------------------------------------|
| `CatalogId`  | BIGINT  | Уникальный идентификатор каждого объекта Catalog. Используется для различения объектов Catalog.                                      |
| `CatalogName`| TEXT    | Имя объекта Catalog. Служит его идентификатором в Doris.                                            |
| `CatalogType`| TEXT    | Тип объекта Catalog (например, база данных или источник данных). Указывает разновидность объекта Catalog.                                 |
| `Property`   | TEXT    | Имя свойства объекта Catalog (например, параметра конфигурации).                                           |
| `Value`      | TEXT    | Значение соответствующего свойства объекта Catalog. Содержит конкретные сведения о конфигурации объекта Catalog. |


## Примеры {#examples}
Просмотр всех сведений об объектах Catalog в кластере Doris
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
