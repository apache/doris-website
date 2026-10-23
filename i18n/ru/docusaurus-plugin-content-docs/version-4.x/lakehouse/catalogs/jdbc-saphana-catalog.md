---
{
    "title": "SAP HANA JDBC Catalog",
    "language": "ru",
    "description": "JDBC Catalog в Doris поддерживает подключение к базе данных SAP HANA через стандартный интерфейс JDBC."
}
---

JDBC Catalog в Doris поддерживает подключение к базе данных SAP HANA через стандартный интерфейс JDBC. В этом документе описано, как настроить подключение к базе данных SAP HANA.

Общие сведения о JDBC Catalog см. в разделе [Обзор JDBC Catalog](./jdbc-catalog-overview.md).

## Примечания по использованию {#usage-notes}

Для подключения к базе данных SAP HANA необходимы:

* SAP HANA версии 2.0 или выше.

* JDBC-драйвер для базы данных SAP HANA, который можно скачать из [Maven Repository](https://mvnrepository.com/artifact/com.sap.cloud.db.jdbc/ngdbc). Рекомендуется использовать ngdbc версии 2.4.51 или выше.

* Сетевое соединение между каждым узлом FE и BE в Doris и сервером SAP HANA; по умолчанию используется порт 30015.

## Подключение к SAP HANA {#connecting-to-sap-hana}

```sql
CREATE CATALOG saphana_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:sap://Hostname:Port/?optionalparameters',
    'driver_url' = 'ngdbc-2.4.51.jar',
    'driver_class' = 'com.sap.db.jdbc.Driver'
)
```

Дополнительные сведения о формате URL JDBC и параметрах, поддерживаемых JDBC-драйвером SAP HANA, см. в [документации SAP HANA](https://help.sap.com/docs/).

## Сопоставление иерархий {#hierarchical-mapping}

При сопоставлении с SAP HANA база данных в Doris соответствует схеме в указанной базе данных SAP HANA («DATABASE» в параметре `jdbc_url`). Таблицы базы данных Doris соответствуют таблицам схемы SAP HANA. Сопоставление выглядит следующим образом:

| Doris    | SAP HANA |
| -------- | -------- |
| Catalog  | База данных |
| База данных | Схема   |
| Таблица    | Таблица    |

## Сопоставление типов столбцов {#column-type-mapping}

| Тип SAP HANA      | Тип Doris                        | Примечание                                                      |
| ------------------ | --------------------------------- | ------------------------------------------------------------ |
| boolean            | boolean                           |                                                              |
| tinyint            | tinyint                           |                                                              |
| smallint           | smallint                          |                                                              |
| integer            | int                               |                                                              |
| bigint             | bigint                            |                                                              |
| smalldecimal(P, S) | decimal(P, S) или double или string | Если точность не указана, используется тип double. Если точность превышает максимальную точность, поддерживаемую Doris, используется тип string. |
| decimal(P, S)      | decimal(P, S) или double или string | То же, что и выше.                                               |
| real               | float                             |                                                              |
| double             | double                            |                                                              |
| date               | date                              |                                                              |
| time               | string                            |                                                              |
| timestamp(S)       | datetime(S)                       |                                                              |
| seconddate         | datetime(S)                       |                                                              |
| varchar            | string                            |                                                              |
| nvarchar           | string                            |                                                              |
| alphanum           | string                            |                                                              |
| shorttext          | string                            |                                                              |
| char(N)            | char(N)                           |                                                              |
| nchar(N)           | char(N)                           |                                                              |
| прочие              | UNSUPPORTED                       |                                                              |
