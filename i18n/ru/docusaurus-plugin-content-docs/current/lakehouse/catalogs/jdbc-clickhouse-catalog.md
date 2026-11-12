---
{
    "title": "Clickhouse JDBC Catalog",
    "language": "ru",
    "description": "JDBC Catalog в Doris поддерживает подключение к базе данных ClickHouse через стандартный интерфейс JDBC."
}
---

JDBC Catalog в Doris поддерживает подключение к базе данных ClickHouse через стандартный интерфейс JDBC. В этом документе описано, как настроить подключение к базе данных ClickHouse.

Обзор JDBC Catalog см. в разделе [Обзор JDBC Catalog](./jdbc-catalog-overview.md)

## Примечания по использованию {#usage-notes}

Для подключения к базе данных ClickHouse необходимы:

* ClickHouse версии 23.x или выше (более ранние версии не прошли полного тестирования).

* JDBC-драйвер для базы данных ClickHouse. Последнюю или нужную версию JDBC-драйвера ClickHouse можно скачать из [репозитория Maven](https://mvnrepository.com/artifact/com.clickhouse/clickhouse-jdbc). Рекомендуется использовать версию 0.4.6 JDBC-драйвера ClickHouse.

* Сетевое соединение между каждым узлом FE и BE в Doris и сервером ClickHouse. Порт по умолчанию: 8123.

## Подключение к ClickHouse {#connecting-to-clickhouse}

```sql
CREATE CATALOG clickhouse PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:clickhouse://example.net:8123/',
    'driver_url' = 'clickhouse-jdbc-0.4.6-all.jar',
    'driver_class' = 'com.clickhouse.jdbc.ClickHouseDriver'
)
```

Параметр `jdbc_url` задаёт сведения о подключении и параметры, передаваемые JDBC-драйверу ClickHouse. Поддерживаемые параметры URL перечислены в разделе [Настройка JDBC-драйвера ClickHouse](https://clickhouse.com/docs/en/integrations/java#configuration).

### Безопасность подключения {#connection-security}

Если на источнике данных настроен TLS и установлен общедоверенный сертификат, можно включить TLS между кластером и источником данных, добавив параметры в строку подключения JDBC, заданную в свойстве jdbc\_url.

Например, чтобы включить TLS, добавьте параметр ssl=true в свойство конфигурации jdbc\_url:

```sql
'jdbc_url' = 'jdbc:clickhouse://example.net:8123/db?ssl=true'
```

Дополнительные сведения о параметрах настройки TLS см. в [разделе настройки SSL в документации JDBC-драйвера Clickhouse](https://clickhouse.com/docs/en/integrations/java#connect-to-clickhouse-with-ssl)

## Сопоставление иерархий {#hierarchical-mapping}

При сопоставлении с ClickHouse база данных в Doris соответствует базе данных в ClickHouse. Таблица в базе данных Doris соответствует таблицам в этой базе данных ClickHouse. Схема сопоставления приведена ниже:

| Doris    | ClickHouse        |
| -------- | ----------------- |
| Catalog  | Сервер ClickHouse |
| База данных | База данных    |
| Таблица  | Таблица           |

## Сопоставление типов столбцов {#column-type-mapping}

| Тип ClickHouse            | Тип Doris               | Комментарий                      |
| ------------------------- | ----------------------- | -------------------------------- |
| bool                      | boolean                 |                                  |
| string                    | string                  |                                  |
| date/date32               | date                    |                                  |
| datetime(S)/datetime64(S) | datetime(S)             |                                  |
| float32                   | float                   |                                  |
| float64                   | double                  |                                  |
| int8                      | tinyint                 |                                  |
| int16/uint8               | smallint                | В Doris нет типов данных UNSIGNED, поэтому используется тип на одну ступень большей разрядности |
| int32/uInt16              | int                     | То же, что и выше                |
| int64/uint32              | bigint                  | То же, что и выше                |
| int128/uint64             | largeint                | То же, что и выше                |
| int256/uint128/uint256    | string                  | В Doris нет типов данных такой разрядности, поэтому используется STRING |
| decimal(P, S)             | decimal(P, S) или string | Если точность превышает максимальную поддерживаемую в Doris, используется string |
| enum/ipv4/ipv6 | string | |
| uuid | uuid | Сопоставляется с нативным типом UUID; в предыдущих выпусках 4.x и 3.x сопоставляется со STRING. |
| array                     | array                   |                                  |
| прочие                    | UNSUPPORTED             |                                  |

## Связанные параметры {#related-parameters}

- `jdbc_clickhouse_query_final`

  Переменная сеанса, значение по умолчанию false. При значении true к SQL-инструкциям, отправляемым в Clickhouse, добавляется `SETTINGS final = 1`.

## Распространённые проблемы {#common-issues}

1. При чтении данных Clickhouse возникает ошибка `NoClassDefFoundError: net/jpountz/lz4/LZ4Factory`

   Сначала скачайте пакет [lz4-1.3.0.jar](https://repo1.maven.org/maven2/net/jpountz/lz4/lz4/1.3.0/lz4-1.3.0.jar) и поместите его в каталог `custom_lib/` внутри каждого каталога FE и BE (если такого каталога нет, создайте его вручную).
