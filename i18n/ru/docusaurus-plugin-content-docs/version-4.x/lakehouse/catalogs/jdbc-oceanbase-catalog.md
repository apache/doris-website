---
{
    "title": "JDBC Catalog для Oceanbase",
    "language": "ru",
    "description": "Doris JDBC Catalog поддерживает подключение к базе данных OceanBase через стандартный интерфейс JDBC."
}
---

Doris JDBC Catalog поддерживает подключение к базе данных OceanBase через стандартный интерфейс JDBC. В этом документе описывается настройка подключения к базе данных OceanBase.

Общие сведения о JDBC Catalog см. в разделе [Обзор JDBC Catalog](./jdbc-catalog-overview.md).

## Примечания по использованию {#usage-notes}

Для подключения к базе данных OceanBase необходимы:

* OceanBase 3.1.0 или более поздней версии.

* Драйвер JDBC для базы данных OceanBase. Последнюю или нужную версию драйвера JDBC для OceanBase можно скачать из [Maven Repository](https://mvnrepository.com/artifact/com.oceanbase/oceanbase-client). Рекомендуется использовать OceanBase Connector/J 2.4.8 или более поздней версии.

* Сетевое соединение между каждым узлом FE и BE в Doris и сервером OceanBase.

## Подключение к OceanBase {#connect-to-oceanbase}

```sql
CREATE CATALOG oceanbase_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:oceanbase://host:port/db',
    'driver_url' = 'oceanbase-client-2.4.8.jar',
    'driver_class' = 'com.oceanbase.jdbc.Driver'
)
```

`jdbc_url` задаёт сведения о подключении и параметры, передаваемые драйверу JDBC для OceanBase. Поддерживаемые параметры URL приведены в разделе [Настройка драйвера JDBC для OceanBase](https://www.oceanbase.com/docs/common-oceanbase-connector-j-cn-1000000000517111).

## Совместимость схем {#schema-compatibility}

При создании Catalog для OceanBase Doris автоматически определяет, в каком режиме работает OceanBase, MySQL или Oracle, чтобы корректно обрабатывать метаданные.

Сопоставление иерархий и типов, а также оптимизация запросов в разных режимах выполняются так же, как в Catalog для баз данных MySQL или Oracle. Подробнее см. в документации:

* [Catalog для MySQL](./jdbc-mysql-catalog.md)

* [Catalog для Oracle](./jdbc-oracle-catalog.md)
