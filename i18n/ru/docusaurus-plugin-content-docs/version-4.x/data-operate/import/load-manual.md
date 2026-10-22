---
{
    "title": "Обзор загрузки данных",
    "language": "ru",
    "description": "Как выбрать способ загрузки данных в Apache Doris для четырёх сценариев: записи в реальном времени, потоковой синхронизации, пакетной загрузки и интеграции с внешними источниками данных.",
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

Apache Doris предоставляет несколько способов загрузки и интеграции данных, позволяющих записывать данные в базу данных из разных источников. На примере типичных бизнес-сценариев в этом документе объясняется, как выбрать наиболее подходящее решение из четырёх категорий: **запись в реальном времени**, **потоковая синхронизация**, **пакетная загрузка** и **интеграция с внешними источниками данных**.

## Быстрая навигация {#quick-navigation}

В следующей таблице можно быстро найти рекомендуемый способ загрузки в зависимости от источника данных и требований к оперативности их поступления:

| Бизнес-сценарий | Источник данных | Рекомендуемый способ загрузки |
| :--------------------------------------------------------------- | :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запись из приложения в реальном времени (очень малый объём, каждые 5 минут) | Клиент JDBC | [JDBC INSERT](./import-way/insert-into-manual.md) |
| Запись из приложения небольшими пакетами с высоким параллелизмом или высокой частотой | JDBC / HTTP | [Group Commit](./load-best-practices/group-commit-manual.md) + JDBC INSERT или Stream Load |
| Запись из приложения с высокой пропускной способностью | HTTP | [Stream Load](./import-way/stream-load-manual) |
| Приём потоков данных в реальном времени | Flink | [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector.md) |
| Приём данных из очереди сообщений в реальном времени | Kafka | [Routine Load](./import-way/routine-load-manual.md) или [Doris Kafka Connector](../../connection-integration/data-integration/doris-kafka-connector.md) |
| Синхронизация транзакционной базы данных в реальном времени (без внешних компонентов) | MySQL / PostgreSQL | [Непрерывная загрузка с помощью Streaming Job](./import-way/streaming-job/continuous-load-overview.md) |
| Синхронизация транзакционной базы данных с помощью CDC | MySQL / PostgreSQL и др. | [Flink CDC](../../connection-integration/data-integration/flink-doris-connector.md) или [DataX](../../connection-integration/data-integration/datax.md) |
| Непрерывная загрузка из объектного хранилища (автоматическая инкрементальная загрузка файлов) | S3 | [Непрерывная загрузка с помощью Streaming Job](./import-way/streaming-job/continuous-load-overview.md) |
| Пакетная загрузка файлов из объектного хранилища / HDFS | S3 / OSS / HDFS | [Broker Load](./import-way/broker-load-manual.md) или [INSERT INTO SELECT](./import-way/insert-into-manual.md) |
| Пакетная загрузка локальных файлов | Локальный диск | [Stream Load](./import-way/stream-load-manual) или [Doris Streamloader](../../connection-integration/data-integration/doris-streamloader.md) |
| Запросы к внешним источникам данных (озёрам данных / внешним таблицам) и загрузка из них | Hive / Iceberg / JDBC и др. | [Catalog](../../lakehouse/lakehouse-overview.md) + [INSERT INTO SELECT](./import-way/insert-into-manual.md) |

> По умолчанию каждая загрузка в Doris представляет собой неявную транзакцию. Дополнительные сведения о транзакциях см. в разделе [Транзакции](../transaction.md).

## Выбор способа загрузки по сценарию {#choosing-a-load-method-by-scenario}

### Запись в реальном времени: прямая запись из приложения {#real-time-write-direct-application-write}

<!-- Knowledge type: Operation steps -->

Этот вариант подходит для сценариев, в которых приложения **записывают данные в реальном времени** в таблицы Doris через HTTP или JDBC. Он часто используется там, где требуются анализ и запросы в реальном времени.

- **Очень малый объём данных (примерно раз в 5 минут)**: используйте [JDBC INSERT](./import-way/insert-into-manual.md) для записи данных.
- **Высокий параллелизм или высокая частота записи (более 20 одновременных операций или несколько записей за 1 минуту)**: включите [Group Commit](./load-best-practices/group-commit-manual.md) и используйте его совместно с JDBC INSERT или Stream Load.
- **Запись с высокой пропускной способностью**: используйте [Stream Load](./import-way/stream-load-manual) для записи данных по протоколу HTTP.

### Потоковая синхронизация: приём потоков данных в реальном времени {#streaming-sync-real-time-data-stream-ingestion}

<!-- Knowledge type: Architecture selection decision -->

Этот вариант подходит для сценариев, в которых данные непрерывно синхронизируются с таблицами Doris через потоки данных в реальном времени (например, Flink, Kafka или CDC транзакционных баз данных).

1. **Поток данных Flink в реальном времени**

    Используйте [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector.md) для записи потоков данных Flink в реальном времени в таблицы Doris.

2. **Поток данных Kafka в реальном времени**

    Выберите [Routine Load](./import-way/routine-load-manual.md) или [Doris Kafka Connector](../../connection-integration/data-integration/doris-kafka-connector.md). Их различия приведены ниже:

    | Способ | Направление передачи данных | Поддерживаемые форматы |
    | :----------------- | :---------------------------------------- | :----------------------------- |
    | Routine Load | Doris активно извлекает данные из Kafka | csv, json |
    | Kafka Connector | Kafka активно отправляет данные в Doris | avro, json, csv, protobuf |

3. **Синхронизация транзакционной базы данных с помощью CDC**

    Используйте [Flink CDC](../../connection-integration/data-integration/flink-doris-connector.md) или [DataX](../../connection-integration/data-integration/datax.md) для записи потоков данных CDC из транзакционных баз данных в Doris.

4. **Непрерывная загрузка с помощью Streaming Job (без внешних компонентов)**

    Встроенный в Doris механизм [Streaming Job](./import-way/streaming-job/continuous-load-overview.md) позволяет непрерывно считывать данные из таких источников, как MySQL, PostgreSQL и S3, и записывать их в Doris **без зависимости от внешних компонентов, таких как Flink или Kafka**. Поддерживаются два способа синхронизации:

    | Способ синхронизации | Базовый механизм | Автоматическое создание таблиц | Гарантии обработки | Типичный сценарий |
    | :----------------------- | :----------------------------------------- | :------------------ | :----------------- | :--------------------------------------------------------------------- |
    | SQL Mapping Sync | Job + TVF (INSERT INTO SELECT) | Требуется предварительное создание | exactly-once | Сценарии, требующие выбора только нужных столбцов, переименования полей, преобразования типов или фильтрации по условию |
    | Auto Table Creation Sync | Job + встроенный механизм DDL для всей базы данных | Автоматическое создание при первом запуске | at-least-once | Зеркальная репликация всей базы данных или группы таблиц с автоматическим приведением схем целевых таблиц в соответствие со схемами исходных |

### Пакетная загрузка: загрузка файлов из внешних хранилищ {#batch-load-loading-files-from-external-storage}

<!-- Knowledge type: Operation steps -->

Этот вариант подходит для сценариев, не требующих работы в реальном времени, когда файлы из внешних систем хранения (например, объектных хранилищ, HDFS, локальных файлов или NAS) **загружаются пакетами** в таблицы Doris.

- **Файлы в объектном хранилище / HDFS**: используйте [Broker Load](./import-way/broker-load-manual.md) для записи данных в Doris.
- **Файлы в объектном хранилище / HDFS / NAS (синхронная или асинхронная загрузка)**: используйте [INSERT INTO SELECT](./import-way/insert-into-manual.md) для синхронной записи. Для асинхронного выполнения используйте его совместно с планировщиком [JOB](../../admin-manual/workload-management/job-scheduler).
- **Локальные файлы**: используйте [Stream Load](./import-way/stream-load-manual) или [Doris Streamloader](../../connection-integration/data-integration/doris-streamloader) для записи данных в Doris.

### Интеграция с внешними источниками данных: федеративные запросы и загрузка через Catalog {#external-data-source-integration-catalog-federated-query-and-load}

<!-- Knowledge type: Architecture selection decision -->

Этот вариант подходит для сценариев интеграции с внешними источниками данных (например, Hive, JDBC или Iceberg), когда нужно выполнять запросы к внешним данным и **загружать их по мере необходимости** в таблицы Doris.

- Создайте [Catalog](../../lakehouse/lakehouse-overview.md) для чтения данных из внешних источников.
- Используйте [INSERT INTO SELECT](./import-way/insert-into-manual.md) для синхронной записи данных из внешнего источника в Doris. Для асинхронного выполнения используйте его совместно с планировщиком [JOB](../../admin-manual/workload-management/job-scheduler).

## Частичное обновление столбцов при загрузке {#partial-column-update-during-load}

<!-- Knowledge type: Configuration parameters -->

Doris поддерживает **частичное обновление столбцов** при загрузке данных: можно обновлять только определённые столбцы таблицы, не передавая значения для всех столбцов. Эта возможность особенно полезна в следующих сценариях:

- Обновление небольшого числа полей в широкой таблице
- Выполнение инкрементальных обновлений (Upsert для части столбцов)

Подробнее о частичном обновлении столбцов в таблицах Unique Key и Aggregate см. в разделе [Обновление столбцов](../update/partial-column-update.md).

## Обзор способов загрузки {#load-method-overview}

Загрузка в Doris включает несколько аспектов: источники данных, форматы данных, способы загрузки, обработку ошибочных данных, преобразование данных и транзакции. В следующей таблице приведены подходящие сценарии использования, поддерживаемые форматы файлов и режимы загрузки для каждого способа:

| Способ загрузки | Сценарий использования | Поддерживаемые форматы файлов | Режим загрузки |
| :------------------------------------------------------- | :---------------------------------------------------- | :----------------------- | :----------- |
| [Stream Load](./import-way/stream-load-manual) | Загрузка локальных файлов или запись из приложений | csv, json, parquet, orc | Синхронный |
| [Broker Load](./import-way/broker-load-manual.md) | Загрузка из объектных хранилищ, HDFS и др. | csv, json, parquet, orc | Асинхронный |
| [INSERT INTO VALUES](./import-way/insert-into-manual.md) | Загрузка через такие интерфейсы, как JDBC | SQL | Синхронный |
| [INSERT INTO SELECT](./import-way/insert-into-manual.md) | Загрузка из внешних таблиц, объектных хранилищ или HDFS | SQL | Синхронный |
| [Routine Load](./import-way/routine-load-manual.md) | Загрузка из Kafka в реальном времени | csv, json | Асинхронный |
| [MySQL Load](./import-way/mysql-load-manual.md) | Загрузка локальных данных | csv | Синхронный |
| [Group Commit](./load-best-practices/group-commit-manual.md) | Загрузка небольшими пакетами с высокой частотой | Зависит от используемого способа загрузки | - |
| [Streaming Job](./import-way/streaming-job/continuous-load-overview.md) | Непрерывная загрузка из таких источников, как MySQL, PostgreSQL и S3 | Зависит от источника данных | Асинхронный |

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Load method selection / Troubleshooting -->

**Вопрос 1: Какой способ загрузки выбрать для записи небольшими пакетами с высоким параллелизмом?**

Включите [Group Commit](./load-best-practices/group-commit-manual.md) и используйте его совместно с JDBC INSERT или Stream Load. Когда число одновременных операций превышает 20 или за 1 минуту выполняется несколько записей, Group Commit может значительно снизить нагрузку на систему загрузки.

**Вопрос 2: Чем Routine Load отличается от Doris Kafka Connector?**

- Routine Load: Doris планирует выполнение задач, которые **активно извлекают** данные из Kafka. Поддерживаются форматы csv и json.
- Doris Kafka Connector: Kafka **активно отправляет** данные в Doris. Поддерживаются форматы avro, json, csv и protobuf.

**Вопрос 3: Как загрузить локальные файлы в Doris?**

Можно использовать [Stream Load](./import-way/stream-load-manual) (подходит для файлов малого и среднего размера) или [Doris Streamloader](../../connection-integration/data-integration/doris-streamloader.md) (подходит для пакетной загрузки больших файлов).

**Вопрос 4: Можно ли загрузить в Doris данные из внешних источников, таких как Hive или Iceberg?**

Да. Сначала подключитесь к внешнему источнику данных через [Catalog](../../lakehouse/lakehouse-overview.md), затем используйте [INSERT INTO SELECT](./import-way/insert-into-manual.md) для синхронной записи данных в Doris. Для асинхронного выполнения используйте его совместно с планировщиком [JOB](../../admin-manual/workload-management/job-scheduler).

**Вопрос 5: Предоставляются ли транзакционные гарантии при загрузке?**

Да. По умолчанию каждая загрузка в Doris представляет собой неявную транзакцию. Подробнее см. в разделе [Транзакции](../transaction.md).

**Вопрос 6: Как выбрать между Streaming Job и Flink CDC?**

- **Streaming Job**: встроенная возможность Doris, которая **не зависит от внешних компонентов, таких как Flink или Kafka**. Поддерживает SQL Mapping Sync и Auto Table Creation Sync для MySQL и PostgreSQL, а также непрерывную загрузку из S3. Auto Table Creation Sync автоматически создаёт целевые таблицы, а SQL Mapping Sync обеспечивает семантику exactly-once и поддерживает обработку с помощью SQL.
- **Flink CDC**: требует развёртывания кластера Flink. Подходит для сценариев, в которых уже используется система потоковой обработки Flink, требуется сложная обработка ETL или синхронизация с несколькими целевыми системами.

Если требуется только непрерывная синхронизация данных MySQL или PostgreSQL с Doris и нет требований к внешней потоковой обработке, **отдайте предпочтение Streaming Job**. Подробнее см. в разделе [Обзор непрерывной загрузки](./import-way/streaming-job/continuous-load-overview.md).
