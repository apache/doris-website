---
{
    "title": "JDBC Catalog для IBM Db2",
    "language": "ru",
    "description": "JDBC Catalog в Doris поддерживает подключение к базам данных IBM Db2 через стандартный интерфейс JDBC."
}
---

JDBC Catalog в Doris поддерживает подключение к базам данных IBM Db2 через стандартный интерфейс JDBC. В этом документе описано, как настроить подключение к базе данных IBM Db2.

Общие сведения о JDBC Catalog приведены в разделе [Обзор JDBC Catalog](./jdbc-catalog-overview.md).

## Примечания по использованию {#usage-notes}

Для подключения к базе данных IBM Db2 необходимы:

* IBM Db2 версии 11.5.x или выше.

* Драйвер JDBC для базы данных IBM Db2. Последнюю или определённую версию драйвера IBM Db2 можно скачать из [репозитория Maven](https://mvnrepository.com/artifact/com.ibm.db2/jcc). Рекомендуется использовать IBM db2 jcc версии 11.5.8.0.

* Сетевое соединение каждого узла FE и BE Doris с сервером IBM Db2; порт по умолчанию: 51000.

## Подключение к IBM Db2 {#connecting-to-ibm-db2}

```sql
CREATE CATALOG db2_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'USERNAME',
    'password' = 'PASSWORD',
    'jdbc_url' = 'jdbc:db2://host:port/database',
    'driver_url' = 'jcc-11.5.8.0.jar',
    'driver_class' = 'com.ibm.db2.jcc.DB2Driver'
)
```

Параметр `jdbc_url` задаёт сведения о подключении и параметры, передаваемые драйверу IBM Db2. Поддерживаемые параметры URL перечислены в [документации драйвера JDBC для Db2](https://www.ibm.com/docs/en/db2-big-sql/5.0?topic=drivers-jdbc-driver).

## Сопоставление иерархий {#hierarchical-mapping}

При сопоставлении IBM Db2 база данных Doris соответствует схеме в указанной базе данных DB2 (параметр "database" в `jdbc_url`). Таблица в базе данных Doris соответствует таблицам в схеме DB2. Соответствие показано ниже:

| Doris    | IBM Db2  |
| -------- | -------- |
| Catalog  | DataBase |
| Database | Schema   |
| Table    | Table    |

## Сопоставление типов столбцов {#column-type-mapping}

| Тип IBM Db2      | Тип Doris     | Комментарий |
| ---------------- | ------------- | ------- |
| smallint         | smallint      |         |
| int              | int           |         |
| bigint           | bigint        |         |
| double           | double        |         |
| double precision | double        |         |
| float            | double        |         |
| real             | float         |         |
| decimal(P, S)    | decimal(P, S) |         |
| decfloat(P, S)   | decimal(P, S) |         |
| date             | date          |         |
| timestamp(S)     | datetime(S)   |         |
| char(N)          | char(N)       |         |
| varchar(N)       | varchar(N)    |         |
| long varchar(N)  | varchar(N)    |         |
| vargraphic       | string        |         |
| long vargraphic  | string        |         |
| time             | string        |         |
| clob             | string        |         |
| xml              | string        |         |
| BLOB | VARBINARY | Начиная с версии 4.1.5, этот тип всегда сопоставляется с `VARBINARY`. Свойство `enable.mapping.varbinary` сохранено для совместимости; установка значения `false` больше не восстанавливает сопоставление с `STRING`. В более ранних версиях это свойство позволяет выбрать прежнее сопоставление. |
| другие           | UNSUPPORTED   |         |

## Распространённые проблемы {#common-issues}

1. При чтении данных IBM Db2 через JDBC Catalog возникает исключение `Invalid operation: result set is closed. ERRORCODE=-4470`.

    При создании Catalog для IBM Db2 добавьте в строку подключения jdbc\_url следующие параметры: `allowNextOnExhaustedResultSet=1;resultSetHoldability=1;`. Например: `jdbc:db2://host:port/database:allowNextOnExhaustedResultSet=1;resultSetHoldability=1;`.

2. Перехвачено исключение java.io.CharConversionException

    Эта проблема может быть связана с кодировкой. Попробуйте добавить параметр `-Ddb2.jcc.charsetDecoderEncoder=3` в `JAVA_OPTS` в файле `be.conf`, затем перезапустить BE и проверить, устранена ли проблема. Также можно попробовать значения `1` или `2`. Подробнее см.: https://www.ibm.com/docs/en/content-collector/4.0.1?topic=manager-jdbc-throws-javaiocharconversionexception
