---
{
    "title": "Обзор загрузки данных",
    "language": "ru",
    "description": "Как выбрать способ загрузки данных в Apache Doris для четырёх сценариев: запись в реальном времени, потоковая синхронизация, пакетная загрузка и интеграция с внешними источниками данных.",
    "keywords": [
        "загрузка данных в Doris",
        "Stream Load",
        "Broker Load",
        "Routine Load",
        "INSERT INTO",
        "Group Commit",
        "Flink Doris Connector",
        "Kafka Connector",
        "Flink CDC",
        "Streaming Job",
        "непрерывная загрузка",
        "запись в реальном времени",
        "пакетная загрузка",
        "внешний источник данных через Catalog"
    ]
}
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Data load method selection / Data integration solution design -->

Apache Doris предоставляет несколько способов загрузки и интеграции данных, позволяющих записывать данные в базу данных из различных источников. На примере типичных бизнес-сценариев в этом документе объясняется, как выбрать наиболее подходящее решение из четырёх категорий: **запись в реальном времени**, **потоковая синхронизация**, **пакетная загрузка** и **интеграция с внешними источниками данных**.

## Быстрая навигация {#quick-navigation}

В таблице ниже можно быстро найти рекомендуемый способ загрузки в зависимости от источника данных и требований к оперативности их поступления:

| Бизнес-сценарий | Источник данных | Рекомендуемый способ загрузки |
| :--------------------------------------------------------------- | :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запись из приложения в реальном времени (очень малый объём, каждые 5 минут) | Клиент JDBC | [JDBC INSERT](./import-way/insert-into-manual.md) |
| Запись из приложения с высоким параллелизмом или частая запись небольшими пакетами | JDBC / HTTP | [Group Commit](./load-best-practices/group-commit-manual.md) + JDBC INSERT или Stream Load |
| Запись из приложения с высокой пропускной способностью | HTTP | [Stream Load](./import-way/stream-load-manual) |
| Загрузка потоков данных в реальном времени | Flink | [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector/write.md) |
| Загрузка из очереди сообщений в реальном времени | Kafka | [Routine Load](./import-way/routine-load-manual.md) или [Doris Kafka Connector](../../connection-integration/data-integration/doris-kafka-connector.md) |
| Синхронизация транзакционной базы данных в реальном времени (без внешних компонентов) | MySQL / PostgreSQL | [Непрерывная загрузка с помощью Streaming Job](./import-way/streaming-job/continuous-load-overview.md) |
| Синхронизация транзакционной базы данных через CDC | MySQL / PostgreSQL и т. д. | [Flink CDC](../../connection-integration/data-integration/flink-doris-connector/cdc-sync.md) или [DataX](../../connection-integration/data-integration/datax.md) |
| Непрерывная загрузка из объектного хранилища (автоматическая инкрементальная загрузка файлов) | S3 | [Непрерывная загрузка с помощью Streaming Job](./import-way/streaming-job/continuous-load-overview.md) |
| Пакетная загрузка файлов из объектного хранилища / HDFS | S3 / OSS / HDFS | [Broker Load](./import-way/broker-load-manual.md) или [INSERT INTO SELECT](./import-way/insert-into-manual.md) |
| Пакетная загрузка локальных файлов | Локальный диск | [Stream Load](./import-way/stream-load-manual) или [Doris Streamloader](../../connection-integration/data-integration/doris-streamloader.md) |
| Запросы к внешнему источнику данных (озеро данных / внешняя таблица) и загрузка из него | Hive / Iceberg / JDBC и т. д. | [Catalog](../../lakehouse/lakehouse-overview.md) + [INSERT INTO SELECT](./import-way/insert-into-manual.md) |

> Каждая загрузка в Doris по умолчанию представляет собой неявную транзакцию. Подробнее о транзакциях см. в разделе [Транзакции](../transaction.md).

## Выбор способа загрузки в зависимости от сценария {#choosing-a-load-method-by-scenario}

### Запись в реальном времени: прямая запись из приложения {#real-time-write-direct-application-write}

<!-- Knowledge type: Operation steps -->

Этот сценарий предполагает, что приложения **записывают данные в реальном времени** в таблицы Doris через HTTP или JDBC. Такой подход обычно используют, когда бизнесу нужны аналитика и запросы в реальном времени.

- **Очень малый объём данных (примерно раз в 5 минут)**: используйте [JDBC INSERT](./import-way/insert-into-manual.md) для записи данных.
- **Высокий параллелизм или высокая частота записи (более 20 одновременных операций или несколько операций записи в течение 1 минуты)**: включите [Group Commit](./load-best-practices/group-commit-manual.md) и используйте его совместно с JDBC INSERT или Stream Load.
- **Запись с высокой пропускной способностью**: используйте [Stream Load](./import-way/stream-load-manual) для записи данных по протоколу HTTP.

### Потоковая синхронизация: загрузка потоков данных в реальном времени {#streaming-sync-real-time-data-stream-ingestion}

<!-- Knowledge type: Architecture selection decision -->

Этот сценарий предполагает непрерывную синхронизацию данных с таблицами Doris через потоки данных в реальном времени, например Flink, Kafka или CDC транзакционной базы данных.

1. **Поток данных Flink в реальном времени**

    Используйте [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector/write.md) для записи потоков данных Flink в таблицы Doris в реальном времени.

2. **Поток данных Kafka в реальном времени**

    Выберите [Routine Load](./import-way/routine-load-manual.md) или [Doris Kafka Connector](../../connection-integration/data-integration/doris-kafka-connector.md). Их различия приведены ниже:

    | Способ | Направление потока данных | Поддерживаемые форматы |
    | :----------------- | :---------------------------------------- | :----------------------------- |
    | Routine Load | Doris самостоятельно забирает данные из Kafka | csv, json |
    | Kafka Connector | Kafka самостоятельно отправляет данные в Doris | avro, json, csv, protobuf |

3. **Синхронизация транзакционной базы данных через CDC**

    Используйте [Flink CDC](../../connection-integration/data-integration/flink-doris-connector/cdc-sync.md) или [DataX](../../connection-integration/data-integration/datax.md) для записи потоков данных CDC из транзакционных баз данных в Doris.

4. **Непрерывная загрузка с помощью Streaming Job (без внешних компонентов)**

    Встроенный в Doris механизм [Streaming Job](./import-way/streaming-job/continuous-load-overview.md) позволяет непрерывно читать данные из таких источников, как MySQL, PostgreSQL и S3, и записывать их в Doris **без зависимости от внешних компонентов, таких как Flink или Kafka**. Поддерживаются два способа синхронизации:

    | Способ синхронизации | Базовый механизм | Автоматическое создание таблиц | Гарантии обработки | Типичный сценарий |
    | :----------------------- | :----------------------------------------- | :------------------ | :----------------- | :--------------------------------------------------------------------- |
    | SQL Mapping Sync | Job + TVF (INSERT INTO SELECT) | Требуется предварительное создание | exactly-once | Сценарии, в которых нужны отсечение ненужных столбцов, переименование полей, преобразование типов или фильтрация по условию |
    | Auto Table Creation Sync | Job + встроенный механизм DDL для всей базы данных | Автоматически при первом запуске | at-least-once | Зеркальная репликация всей базы данных или группы таблиц; схемы целевых таблиц автоматически обновляются вслед за схемами исходных таблиц |

### Пакетная загрузка: загрузка файлов из внешних хранилищ {#batch-load-loading-files-from-external-storage}

<!-- Knowledge type: Operation steps -->

Этот сценарий предполагает **пакетную загрузку** файлов из внешних систем хранения, таких как объектные хранилища, HDFS, локальные файлы или NAS, в таблицы Doris, когда обработка в реальном времени не требуется.

- **Файлы в объектном хранилище / HDFS**: используйте [Broker Load](./import-way/broker-load-manual.md) для записи данных в Doris.
- **Файлы в объектном хранилище / HDFS / NAS (синхронная или асинхронная загрузка)**: используйте [INSERT INTO SELECT](./import-way/insert-into-manual.md) для синхронной записи. Для асинхронного выполнения используйте его совместно с планировщиком [JOB](../../admin-manual/workload-management/job-scheduler).
- **Локальные файлы**: используйте [Stream Load](./import-way/stream-load-manual) или [Doris Streamloader](../../connection-integration/data-integration/doris-streamloader) для записи данных в Doris.

### Интеграция с внешними источниками данных: федеративные запросы и загрузка через Catalog {#external-data-source-integration-catalog-federated-query-and-load}

<!-- Knowledge type: Architecture selection decision -->

Этот сценарий предполагает интеграцию с внешними источниками данных, такими как Hive, JDBC или Iceberg, для выполнения запросов к внешним данным и их **загрузки по требованию** в таблицы Doris.

- Создайте [Catalog](../../lakehouse/lakehouse-overview.md) для чтения данных из внешних источников.
- Используйте [INSERT INTO SELECT](./import-way/insert-into-manual.md) для синхронной записи данных из внешнего источника в Doris. Для асинхронного выполнения используйте его совместно с планировщиком [JOB](../../admin-manual/workload-management/job-scheduler).

## Частичное обновление столбцов при загрузке {#partial-column-update-during-load}

<!-- Knowledge type: Configuration parameters -->

Doris поддерживает **частичное обновление столбцов** при загрузке данных. Это позволяет обновлять только определённые столбцы таблицы, не передавая значения для всех столбцов. Эта возможность особенно полезна в следующих сценариях:

- Обновление небольшого числа полей в широкой таблице
- Выполнение инкрементальных обновлений (Upsert для части столбцов)

Подробнее о частичном обновлении столбцов в таблицах Unique Key и Aggregate см. в разделе [Обновление столбцов](../update/partial-column-update.md).

## Обзор способов загрузки {#load-method-overview}

Загрузка в Doris включает несколько аспектов: источники данных, форматы данных, способы загрузки, обработку ошибочных данных, преобразование данных и транзакции. В следующей таблице приведены подходящие сценарии, поддерживаемые форматы файлов и режимы загрузки для каждого способа:

| Способ загрузки | Сценарий использования | Поддерживаемые форматы файлов | Режим загрузки |
| :------------------------------------------------------- | :---------------------------------------------------- | :----------------------- | :----------- |
| [Stream Load](./import-way/stream-load-manual) | Загрузка локальных файлов или запись из приложений | csv, json, parquet, orc | Синхронный |
| [Broker Load](./import-way/broker-load-manual.md) | Загрузка из объектного хранилища, HDFS и т. д. | csv, json, parquet, orc | Асинхронный |
| [INSERT INTO VALUES](./import-way/insert-into-manual.md) | Загрузка через такие интерфейсы, как JDBC | SQL | Синхронный |
| [INSERT INTO SELECT](./import-way/insert-into-manual.md) | Загрузка из внешних таблиц, объектного хранилища или HDFS | SQL | Синхронный |
| [Routine Load](./import-way/routine-load-manual.md) | Загрузка из Kafka в реальном времени | csv, json | Асинхронный |
| [MySQL Load](./import-way/mysql-load-manual.md) | Загрузка локальных данных | csv | Синхронный |
| [Group Commit](./load-best-practices/group-commit-manual.md) | Частая загрузка небольшими пакетами | Зависит от используемого способа загрузки | - |
| [Streaming Job](./import-way/streaming-job/continuous-load-overview.md) | Непрерывная загрузка из таких источников, как MySQL, PostgreSQL и S3 | Зависит от источника данных | Асинхронный |

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Load method selection / Troubleshooting -->

**Вопрос 1: Какой способ загрузки выбрать для записи небольшими пакетами с высоким параллелизмом?**

Включите [Group Commit](./load-best-practices/group-commit-manual.md) и используйте его совместно с JDBC INSERT или Stream Load. Если число одновременных операций превышает 20 или в течение 1 минуты выполняется несколько операций записи, Group Commit позволяет существенно снизить нагрузку при загрузке.

**Вопрос 2: Чем отличаются Routine Load и Doris Kafka Connector?**

- Routine Load: Doris планирует задачи, которые **самостоятельно забирают** данные из Kafka. Поддерживаются форматы csv и json.
- Doris Kafka Connector: Kafka **самостоятельно отправляет** данные в Doris. Поддерживаются форматы avro, json, csv и protobuf.

**Вопрос 3: Как загрузить локальные файлы в Doris?**

Можно использовать [Stream Load](./import-way/stream-load-manual) (подходит для небольших и средних файлов) или [Doris Streamloader](../../connection-integration/data-integration/doris-streamloader.md) (подходит для пакетной загрузки больших файлов).

**Вопрос 4: Можно ли загрузить в Doris данные из внешних источников, таких как Hive или Iceberg?**

Да. Сначала подключитесь к внешнему источнику данных через [Catalog](../../lakehouse/lakehouse-overview.md), затем используйте [INSERT INTO SELECT](./import-way/insert-into-manual.md) для синхронной записи данных в Doris. Для асинхронного выполнения используйте его совместно с планировщиком [JOB](../../admin-manual/workload-management/job-scheduler).

**Вопрос 5: Предоставляются ли транзакционные гарантии при загрузке?**

Да. Каждая загрузка в Doris по умолчанию представляет собой неявную транзакцию. Подробнее см. в разделе [Транзакции](../transaction.md).

**Вопрос 6: Как выбрать между Streaming Job и Flink CDC?**

- **Streaming Job**: встроенная возможность Doris, которая **не зависит от внешних компонентов, таких как Flink или Kafka**. Поддерживает SQL Mapping Sync и Auto Table Creation Sync для MySQL и PostgreSQL, а также непрерывную загрузку из S3. Auto Table Creation Sync автоматически создаёт целевые таблицы, а SQL Mapping Sync обеспечивает семантику exactly-once и поддерживает обработку с помощью SQL.
- **Flink CDC**: требует развёртывания кластера Flink. Подходит для сценариев, в которых уже используется система потоковой обработки Flink, нужна сложная обработка ETL или синхронизация с несколькими целевыми системами.

Если вам нужно только непрерывно синхронизировать данные MySQL или PostgreSQL с Doris и внешняя потоковая обработка не требуется, **отдайте предпочтение Streaming Job**. Подробнее см. в разделе [Обзор непрерывной загрузки](./import-way/streaming-job/continuous-load-overview.md).
