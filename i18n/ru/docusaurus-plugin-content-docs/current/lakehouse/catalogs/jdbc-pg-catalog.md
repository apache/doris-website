---
{
    "title": "JDBC Catalog для PostgreSQL",
    "language": "ru",
    "description": "Doris JDBC Catalog поддерживает подключение к базам данных PostgreSQL через стандартный интерфейс JDBC."
}
---

Doris JDBC Catalog поддерживает подключение к базам данных PostgreSQL через стандартный интерфейс JDBC. В этом документе описано, как настроить подключение к базе данных PostgreSQL.

Общие сведения о JDBC Catalog см. в разделе [Обзор JDBC Catalog](./jdbc-catalog-overview.md).

## Примечания по использованию {#usage-notes}

Для подключения к базе данных PostgreSQL необходимы:

* PostgreSQL 11.x или выше.

* JDBC-драйвер для базы данных PostgreSQL. Последнюю или нужную версию можно скачать из [Maven Repository](https://mvnrepository.com/artifact/org.postgresql/postgresql). Рекомендуется использовать PostgreSQL JDBC Driver версии 42.5.x или выше.

* Сетевое соединение между каждым узлом FE и BE в Doris и сервером PostgreSQL. Порт по умолчанию: 5432.

## Подключение к PostgreSQL {#connecting-to-postgresql}

```sql
CREATE CATALOG postgresql_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:postgresql://host:5432/postgres',
    'driver_url' = 'postgresql-42.5.6.jar',
    'driver_class' = 'org.postgresql.Driver'
);
```

`jdbc_url` задаёт сведения о подключении и параметры, передаваемые JDBC-драйверу PostgreSQL. Поддерживаемые параметры URL перечислены в [документации PostgreSQL JDBC Driver](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database).

### Безопасность подключения {#connection-security}

Если на источнике данных настроен TLS и установлен сертификат, признанный общедоверенным, можно включить TLS между кластером и источником данных, добавив параметры в строку подключения JDBC, заданную в свойстве jdbc\_url.

Например, для версии 42 JDBC-драйвера PostgreSQL TLS включается добавлением параметра ssl=true в свойство конфигурации jdbc\_url:

```sql
"jdbc_url"="jdbc:postgresql://example.net:5432/database?ssl=true"
```

Подробнее о параметрах настройки TLS см. в [документации PostgreSQL JDBC Driver](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database).

## Сопоставление иерархий {#hierarchical-mapping}

При сопоставлении с PostgreSQL база данных в Doris соответствует схеме в заданной базе данных PostgreSQL (как в примере с параметром `jdbc_url` для базы данных `postgres`). Таблица в базе данных Doris соответствует таблице в этой схеме PostgreSQL. Соответствие показано ниже:

| Doris    | PostgreSQL |
| -------- | ---------- |
| Catalog  | База данных   |
| База данных | Схема     |
| Таблица    | Таблица      |

## Сопоставление типов столбцов {#column-type-mapping}

| Тип PostgreSQL                         | Тип Doris             |                                                                 |
| --------------------------------------- | ---------------------- | --------------------------------------------------------------- |
| boolean                                 | boolean                |                                                                 |
| smallint/int2                           | smallint               |                                                                 |
| integer/int4                            | int                    |                                                                 |
| bigint/int8                             | bigint                 |                                                                 |
| decimal/numeric                         | decimal(P, S) / string | Тип numeric без указания точности сопоставляется с типом string. Для числовых вычислений его необходимо преобразовать в тип decimal. Обратная запись не поддерживается.    |
| real/float4                             | float                  |                                                                 |
| double                                  | double                 |                                                                 |
| smallserial                             | smallint               |                                                                 |
| serial                                  | int                    |                                                                 |
| bigserial                               | bigint                 |                                                                 |
| char(N)                                 | char(N)                |                                                                 |
| varchar/text                            | string                 |                                                                 |
| timestamp(S)              | datetime(S)            |                                                                 |
| timestamptz(S) | TIMESTAMPTZ(S) | Начиная с версии 4.1.5 этот тип всегда сопоставляется с `TIMESTAMPTZ(S)`. Свойство `enable.mapping.timestamp_tz` сохранено для совместимости; установка значения `false` больше не восстанавливает сопоставление с `DATETIME`. Точность ограничена значением 6, поэтому более высокая точность теряется. В более ранних версиях это свойство позволяет выбрать прежнее сопоставление. |
| date                                    | date                   |                                                                 |
| json/jsonb                              | string                 | Для баланса производительности чтения и вычислений Doris сопоставляет тип JSON с типом STRING.                   |
| time                                    | string                 | Doris не поддерживает тип time, поэтому он сопоставляется с типом string.                          |
| interval                                | string                 |                                                                 |
| point/line/lseg/box/path/polygon/circle | string                 |                                                                 |
| cidr/inet/macaddr                       | string                 |                                                                 |
| uuid                                    | string                 |                                                                 |
| bit                                     | boolean / string       | Doris не поддерживает тип bit. При bit(1) он сопоставляется с типом boolean, а в остальных случаях с типом string. |
| bytea | VARBINARY | Начиная с версии 4.1.5 этот тип всегда сопоставляется с `VARBINARY`. Свойство `enable.mapping.varbinary` сохранено для совместимости; установка значения `false` больше не восстанавливает сопоставление с `STRING`. В более ранних версиях это свойство позволяет выбрать прежнее сопоставление. |
| array                                   | array                  | Способы сопоставления типов массивов описаны ниже. |
| другие                                   | UNSUPPORTED            |                                                                 |

- Типы массивов

    В PostgreSQL типы массивов можно определять следующим образом:

    ```
    col1 text[]
    col2 in4[][]
    ```

    Однако число измерений массива нельзя получить непосредственно из метаданных PostgreSQL. Например, `text[]` может быть как одномерным, так и двумерным массивом. Число измерений массива можно определить только после записи данных.

    Doris требует явно указывать число измерений массива. Поэтому Doris может правильно сопоставить тип только в том случае, если соответствующий столбец с массивами в PostgreSQL содержит данные; в противном случае столбец будет сопоставлен с `UNSUPPORTED`.

## Приложение {#appendix}

### Проблемы с часовыми поясами {#time-zone-issues}

Поскольку Doris не поддерживает типы timestamp с часовыми поясами, при чтении типа timestampz из PostgreSQL Doris сопоставляет его с типом DATETIME и преобразует время в местный часовой пояс.

При чтении данных из Catalog типа JDBC часть BE, написанная на Java, использует часовой пояс JVM. По умолчанию часовой пояс JVM совпадает с часовым поясом машины, на которой развёрнут BE. Это влияет на преобразование часовых поясов при чтении данных через JDBC.

Чтобы обеспечить согласованность часовых поясов, рекомендуется задать часовой пояс JVM в `JAVA_OPTS` файла `be.conf` так, чтобы он совпадал со значением `time_zone` сеанса Doris.
