---
{
    "title": "Lookup Join",
    "language": "ru",
    "description": "Использование Flink Doris Connector для соединения с таблицами измерений через Lookup Join: пакетные асинхронные запросы и параметры Lookup."
}
---

# Lookup Join {#lookup-join}

Lookup Join позволяет повысить производительность соединений с таблицами измерений во Flink. При использовании Flink JDBC Connector для соединений с таблицами измерений могут возникнуть следующие проблемы:

- Flink JDBC Connector использует синхронный режим запросов: при поступлении каждой записи из вышестоящего источника данных (например, Kafka) сразу выполняется запрос к таблице измерений Doris, что приводит к высокой задержке при большом числе параллельных запросов.
- Запросы через JDBC обычно выполняют точечный поиск по одной записи, тогда как Doris рекомендует пакетные запросы для повышения эффективности.

Использование [Lookup Join](https://nightlies.apache.org/flink/flink-docs-release-1.20/docs/dev/table/sql/queries/joins/#lookup-join) во Flink Doris Connector даёт следующие преимущества:

- Кэширование входящих данных пакетами позволяет избежать высокой задержки и нагрузки на базу данных, вызванных запросами для каждой отдельной записи.
- Асинхронное выполнение запросов для соединения таблиц повышает пропускную способность обработки данных и снижает нагрузку от запросов к Doris.

## Пример {#example}

Для таблицы измерений необходимо задать `jdbc-url`, через который выполняются запросы Lookup. Включите кэширование с помощью параметров `lookup.cache.*`:

```sql
CREATE TABLE fact_table (
    `id` BIGINT,
    `name` STRING,
    `city` STRING,
    `process_time` as proctime()
) WITH (
    'connector' = 'kafka',
    ...
);

create table dim_city(
    `city` STRING,
    `level` INT,
    `province` STRING,
    `country` STRING
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
    'table.identifier' = 'dim.dim_city',
    'username' = 'root',
    'password' = '',
    'lookup.cache.max-rows' = '100000',
    'lookup.cache.ttl' = '300s'
);

SELECT a.id, a.name, a.city, c.province, c.country, c.level
FROM fact_table a
LEFT JOIN dim_city FOR SYSTEM_TIME AS OF a.process_time AS c
ON a.city = c.city
```

## Параметры {#options}

| Ключ                              | Значение по умолчанию | Обязательный | Описание                                      |
| --------------------------------- | ------------- | -------- | --------------------------------------------- |
| lookup.cache.max-rows             | -1            | Нет      | Максимальное количество строк, кэшируемых при lookup. Значение по умолчанию -1 означает, что кэширование отключено. |
| lookup.cache.ttl                  | 10s           | Нет      | Максимальное время хранения данных в кэше lookup. Значение по умолчанию: 10s. |
| lookup.max-retries                | 1             | Нет      | Количество повторных попыток после сбоя запроса lookup. |
| lookup.jdbc.async                 | FALSE         | Нет      | Определяет, включён ли асинхронный lookup. По умолчанию false. |
| lookup.jdbc.read.batch.size       | 128           | Нет      | Максимальный размер пакета для одного запроса при асинхронном lookup. |
| lookup.jdbc.read.batch.queue-size | 256           | Нет      | Размер промежуточной буферной очереди при асинхронном lookup. |
| lookup.jdbc.read.thread-size      | 3             | Нет      | Количество потоков JDBC для lookup в каждой задаче. |
