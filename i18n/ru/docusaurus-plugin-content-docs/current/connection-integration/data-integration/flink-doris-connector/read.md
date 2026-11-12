---
{
    "title": "Чтение данных из Doris",
    "language": "ru",
    "description": "Параллельное чтение данных из Doris с помощью Flink Doris Connector по протоколу Thrift или Arrow Flight SQL с использованием параметров Source."
}
---

# Чтение данных из Doris {#reading-data-from-doris}

Flink Doris Connector позволяет использовать таблицу Doris в качестве источника для задания Flink. По умолчанию коннектор читает ограниченный снимок таблицы; о непрерывном чтении изменений на уровне строк см. [Инкрементальное чтение с Doris Changelog](./incremental-read.md).

## Принцип чтения {#how-it-works}

![FlinkConnectorPrinciples-JDBC-Doris](/images/next/connection-integration/data-integration/flink-doris-connector.jpg)

По сравнению с Flink JDBC Connector, Flink Doris Connector обеспечивает более высокую производительность чтения данных и рекомендуется к использованию:

- **Flink JDBC Connector**: хотя Doris совместим с протоколом MySQL, при чтении и записи через JDBC данные читаются и записываются последовательно на одном узле FE, что создаёт узкое место и снижает производительность. Использование этого коннектора не рекомендуется.
- **Flink Doris Connector**: начиная с Doris 2.1, в качестве протокола чтения по умолчанию используется ADBC. Чтение выполняется следующим образом:
    1. Flink Doris Connector получает от FE сведения о Tablet ID из плана запроса.
    2. Формирует запрос `SELECT * FROM tbs TABLET(id1, id2, id3)`.
    3. Выполняет запрос через порт ADBC на FE.
    4. BE возвращает данные напрямую, без передачи через FE, что устраняет узкое место в виде единственного узла FE.

## Протоколы чтения {#protocols}

Поддерживаются следующие два протокола чтения:

| Протокол       | Описание                                                  | Рекомендуемая версия |
| -------------- | ------------------------------------------------------------ | ------------------- |
| Thrift         | Читает данные через интерфейс thrift на BE                  | Совместим со всеми версиями |
| ArrowFlightSQL | Читает большие пакеты данных с высокой скоростью по протоколу Arrow Flight SQL на базе Doris 2.1 | Connector 24.0.0+   |

- Подробнее о процессе чтения через Thrift см. [Чтение данных через интерфейс Thrift](https://github.com/apache/doris/blob/master/samples/doris-demo/doris-source-demo/README.md).
- Подробнее об использовании ArrowFlightSQL см. [Высокоскоростной канал передачи данных на базе Arrow Flight SQL](https://doris.apache.org/docs/dev/db-connect/arrow-flight-sql-connect/). В версиях после Doris 2.1 рекомендуется использовать ArrowFlightSQL.

## Чтение с помощью FlinkSQL {#flink-sql}

### Чтение через Thrift {#thrift-method}

```sql
CREATE TABLE student (
    id INT,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',  -- FE host:HttpPort
    'table.identifier' = 'test.student',
    'username' = 'root',
    'password' = ''
);

SELECT * FROM student;
```

### Чтение через Arrow Flight SQL {#arrow-flight-sql-method}

```sql
CREATE TABLE student (
    id INT,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '{fe.conf:http_port}',
    'table.identifier' = 'test.student',
    'source.use-flight-sql' = 'true',
    'source.flight-sql-port' = '{fe.conf:arrow_flight_sql_port}',
    'username' = 'root',
    'password' = ''
);

SELECT * FROM student;
```

## Чтение с помощью DataStream API {#datastream-api-read}

О чтении с помощью `DorisSource` см. [DataStream API](./datastream-api.md#source).

## Параметры {#options}

Общие параметры подключения перечислены в разделе [Параметры подключения и TLS](./connection.md#common-options); параметры инкрементального чтения приведены в разделе [Инкрементальное чтение с Doris Changelog](./incremental-read.md#options).

| Ключ                        | Значение по умолчанию | Обязательный | Описание                                                                                                                                                |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| doris.request.query.timeout | 21600s        | N        | Время ожидания выполнения запроса к Doris. Значение по умолчанию составляет 6 часов.                                                                                              |
| doris.request.tablet.size   | 1             | N        | Количество Tablet Doris, соответствующих одному Partition. Чем меньше это значение, тем больше Partition создаётся и тем выше параллелизм на стороне Flink, но тем больше нагрузка на Doris. |
| doris.batch.size            | 4064          | N        | Максимальное количество строк, читаемых из BE за один раз. Увеличение этого значения позволяет сократить количество соединений между Flink и Doris и тем самым уменьшить дополнительные затраты времени, вызванные сетевыми задержками. |
| doris.exec.mem.limit        | 8192mb        | N        | Ограничение памяти для одного запроса, в байтах. Значение по умолчанию: 8GB.                                                                                         |
| source.use-flight-sql       | TRUE          | N        | Использовать ли Arrow Flight SQL для чтения                                                                                                            |
| source.flight-sql-port      | -             | N        | При чтении через Arrow Flight SQL указывает порт FE `arrow_flight_sql_port`                                                                              |

**Настройки для DataStream**

| Ключ               | Значение по умолчанию | Обязательный | Описание                                                                                       |
| ------------------ | ------------- | -------- | --------------------------------------------------------------------------------------------- |
| doris.read.field   | --            | N        | Список имён столбцов таблицы Doris для чтения, разделённых запятыми                        |
| doris.filter.query | --            | N        | Выражение для фильтрации читаемых данных. Оно передаётся в Doris для фильтрации данных на стороне источника. Например, `age=18`. |
