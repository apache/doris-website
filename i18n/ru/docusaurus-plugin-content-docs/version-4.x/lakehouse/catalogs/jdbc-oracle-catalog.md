---
{
    "title": "JDBC Catalog для Oracle",
    "language": "ru",
    "description": "JDBC Catalog в Apache Doris поддерживает подключение к базам данных Oracle через стандартный интерфейс JDBC."
}
---

JDBC Catalog в Apache Doris поддерживает подключение к базам данных Oracle через стандартный интерфейс JDBC. В этом документе описана настройка подключений к базам данных Oracle.

Обзор JDBC Catalog приведён в документе: [Обзор JDBC Catalog](./jdbc-catalog-overview.md)

## Примечания по использованию {#usage-notes}

Для подключения к базе данных Oracle необходимы:

* Oracle 19c, 18c, 12c, 11g или 10g.

* Драйвер JDBC для баз данных Oracle. Драйвер Oracle JDBC версии Ojdbc8 и выше можно скачать из [репозитория Maven](https://mvnrepository.com/artifact/com.oracle.database.jdbc).

* Сетевое соединение между каждым узлом FE и BE Apache Doris и сервером Oracle. По умолчанию используется порт 1521; если в Oracle RAC включён ONS, также необходим порт 6200.

## Подключение к Oracle {#connecting-to-oracle}

```sql
CREATE CATALOG oracle_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password'='pwd',
    'jdbc_url' = 'jdbc:oracle:thin:@example.net:1521:orcl',
    'driver_url' = 'ojdbc8.jar',
    'driver_class' = 'oracle.jdbc.driver.OracleDriver'
)
```

`jdbc_url` задаёт сведения о подключении и параметры, передаваемые драйверу JDBC. При использовании драйвера Oracle JDBC Thin синтаксис URL может различаться в зависимости от конфигурации Oracle. Например, URL подключения будет отличаться в зависимости от того, подключаетесь ли вы по Oracle SID или по имени службы Oracle. Подробнее см. в [документации драйвера Oracle Database JDBC](https://docs.oracle.com/en/database/oracle/oracle-database/19/jjdbc/data-sources-and-URLs.html). URL в приведённом выше примере используется для подключения по Oracle SID с именем `orcl`.

## Сопоставление иерархии {#hierarchical-mapping}

При сопоставлении объектов Oracle база данных в Apache Doris соответствует пользователю в Oracle. Таблица в базе данных Apache Doris соответствует таблице, доступной этому пользователю в Oracle. Соответствие выглядит следующим образом:

| Doris    | Oracle   |
| -------- | -------- |
| Catalog  | База данных |
| База данных | Пользователь |
| Таблица  | Таблица  |

## Сопоставление типов столбцов {#column-type-mapping}

| Тип Oracle                            | Тип Doris                            | Комментарий                                                                                                     |
| ------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| number(P) / number(P, 0)              | tinyint/smallint/int/bigint/largeint | Doris выбирает соответствующий тип на основе значения P: P < 3: TINYINT; P < 5: SMALLINT; P < 10: INT; P < 19: BIGINT; P > 19: LARGEINT |
| number(P, S), если (S > 0 && P > S) | decimal(P, S)                        |                                                                                                                 |
| number(P, S), если (S > 0 && P < S) | decimal(S, S)                        |                                                                                                                 |
| number(P, S), если (S < 0)          | tinyint/smallint/int/bigint/largeint | При S < 0 Doris задаёт P значение `P + |S|`, and perform the same mapping as `number(P) / number(P, 0)`                                         |
| number                                |                                      | В настоящее время Doris не поддерживает тип number без заданных P и S                                                                                       |
| decimal(P, S)                         | decimal(P, S)                        |                                                                                                                 |
| float/real                            | double                               |                                                                                                                 |
| date                                  | date                                 |                                                                                                                 |
| timestamp                             | datetime(S)                          |                                                                                                                 |
| timestamp(s) with time zone / timestamp(s) with local time zone | TIMESTAMPTZ(S) | Начиная с 4.1.5, этот тип всегда сопоставляется с `TIMESTAMPTZ(S)`. Свойство `enable.mapping.timestamp_tz` сохранено для совместимости; установка значения `false` больше не восстанавливает сопоставление с `DATETIME`. Точность ограничена значением 6, поэтому более высокая точность теряется. В более ранних версиях это свойство позволяет выбрать прежнее сопоставление. |
| char/nchar                            | string                               |                                                                                                                 |
| varchar2/nvarchar2                    | string                               |                                                                                                                 |
| long/raw/long raw/internal            | string                               |                                                                                                                 |
| BLOB | VARBINARY | Начиная с 4.1.5, этот тип всегда сопоставляется с `VARBINARY`. Свойство `enable.mapping.varbinary` сохранено для совместимости; установка значения `false` больше не восстанавливает сопоставление с `STRING`. В более ранних версиях это свойство позволяет выбрать прежнее сопоставление. |
| other                                 | UNSUPPORTED                          |                                                                                                                 |

## Распространённые проблемы {#common-issues}

1. Ошибка `ONS configuration failed` при создании Oracle Catalog или выполнении запросов к нему

   Добавьте -Doracle.jdbc.fanEnabled=false в JAVA\_OPTS в файле be.conf и обновите драйвер до <https://repo1.maven.org/maven2/com/oracle/database/jdbc/ojdbc8/19.23.0.0/ojdbc8-19.23.0.0.jar>

2. Исключение `Non supported character set (add orai18n.jar in your classpath): ZHS16GBK` при создании Oracle Catalog или выполнении запросов к нему

   Скачайте [orai18n.jar](https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html), поместите его в каталог `custom_lib/` каждого FE и BE (создайте каталог вручную, если он отсутствует) и перезапустите каждый FE и BE.
