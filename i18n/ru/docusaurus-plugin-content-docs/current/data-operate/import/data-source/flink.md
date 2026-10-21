---
{
    "title": "Flink",
    "language": "ru",
    "description": "Как использовать Flink Doris Connector для импорта данных из Flink (Kafka, MySQL и т. д.) в Doris в реальном времени? Полная последовательность действий: создание таблицы, синхронизация и проверка.",
    "keywords": [
        "импорт из Flink в Doris",
        "Flink Doris Connector",
        "синхронизация с Doris через Flink CDC",
        "запись в Doris через FlinkSQL",
        "импорт данных в Doris в реальном времени",
        "синхронизация Kafka и MySQL с Doris"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Real-time data import / Streaming ETL -->

**Flink Doris Connector** позволяет импортировать в Doris данные, полученные с помощью Flink (например, данные, которые Flink читает из Kafka или MySQL), в реальном времени. Он подходит для приёма данных в реальном времени и потоковой обработки ETL.

## Сценарии использования {#applicable-scenarios}

| Сценарий | Описание |
| --- | --- |
| Приём данных в реальном времени | Запись данных из очередей сообщений, таких как Kafka или Pulsar, в Doris в реальном времени |
| Синхронизация баз данных | Синхронизация данных из баз данных, таких как MySQL или Oracle, с Doris через Flink CDC |
| Потоковая обработка ETL | Выполнение вычислений в реальном времени с помощью Flink и запись результатов в Doris |

## Ограничения {#limitations}

- Требуется заранее развёрнутый **кластер Flink**.
- Во Flink должна быть установлена соответствующая версия **Flink Doris Connector**.

## Порядок действий {#procedure}

Полные инструкции по импорту данных с помощью Flink см. в разделе [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector/overview.md). Следующий минимальный пример показывает, как быстро выполнить импорт через Flink.

Процесс состоит из следующих трёх шагов:

1. Создать целевую таблицу в Doris
2. Записать данные через FlinkSQL во Flink
3. Проверить в Doris, что данные успешно импортированы

### Шаг 1: Создайте таблицу в Doris {#step-1-create-a-table-in-doris}

Создайте в Doris целевую таблицу `students` для приёма данных из Flink:

```sql
CREATE TABLE `students` (
    `id` INT NULL,
    `name` VARCHAR(256) NULL,
    `age` INT NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Шаг 2: Импортируйте данные с помощью Flink {#step-2-import-data-with-flink}

Запустите `bin/sql-client.sh`, чтобы открыть консоль FlinkSQL, и выполните следующие инструкции для создания таблицы-приёмника и записи данных:

```sql
CREATE TABLE student_sink (
    id INT,
    name STRING,
    age INT
    )
    WITH (
      'connector' = 'doris',
      'fenodes' = '10.16.10.6:28737',
      'table.identifier' = 'test.students',
      'username' = 'root',
      'password' = '',
      'sink.label-prefix' = 'doris_label'
);

INSERT INTO student_sink values(1,'zhangsan',123)
```

Основные параметры описаны ниже:

| Параметр | Описание |
| --- | --- |
| `connector` | Всегда имеет значение `doris`, указывающее на использование Flink Doris Connector |
| `fenodes` | HTTP-адрес Doris FE в формате `host:http_port` |
| `table.identifier` | Идентификатор целевой таблицы в формате `database.table` |
| `username` | Имя пользователя для входа в Doris |
| `password` | Пароль для входа в Doris |
| `sink.label-prefix` | Префикс Label для задачи импорта через Stream Load. Должен быть глобально уникальным |

### Шаг 3: Проверьте импортированные данные {#step-3-check-the-imported-data}

Выполните запрос к целевой таблице в Doris, чтобы убедиться, что данные успешно импортированы:

```sql
select * from test.students;
+------+----------+------+
| id   | name     | age  |
+------+----------+------+
|  1   | zhangsan |  123 |
+------+----------+------+
```

## Часто задаваемые вопросы {#faq}

**Вопрос 1: Какие источники данных поддерживает Flink Doris Connector?**

Теоретически любые источники данных, поддерживаемые Flink (Kafka, MySQL CDC, файловые системы, очереди сообщений и т. д.), можно использовать для получения данных, которые затем обрабатываются во Flink и записываются в Doris.

**Вопрос 2: Почему значение `sink.label-prefix` должно быть уникальным?**

Flink Doris Connector выполняет импорт на основе Doris Stream Load. Для каждой транзакции требуется уникальное значение Label, чтобы гарантировать семантику Exactly-Once. Повторяющиеся значения Label приводят к конфликтам при импорте.

**Вопрос 3: Какой порт следует указывать в `fenodes`?**

В `fenodes` указывается **HTTP-порт** Doris FE (по умолчанию `8030`), а не порт протокола MySQL (по умолчанию `9030`).

**Вопрос 4: Как синхронизировать данные из баз данных, таких как MySQL или Oracle, с Doris?**

Можно использовать коннектор вместе с Flink CDC. Подробности см. в документации [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector/cdc-sync.md).

## Связанная документация {#related-documents}

- [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector/overview.md)
