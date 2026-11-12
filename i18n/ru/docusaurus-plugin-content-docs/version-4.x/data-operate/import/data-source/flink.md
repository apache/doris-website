---
{
    "title": "Flink",
    "language": "ru",
    "description": "Как использовать Flink Doris Connector для импорта данных из Flink (Kafka, MySQL и т. д.) в Doris в реальном времени? Подробные инструкции по созданию таблиц, синхронизации и проверке.",
    "keywords": [
        "Импорт из Flink в Doris",
        "Flink Doris Connector",
        "Синхронизация с Doris через Flink CDC",
        "Запись в Doris через FlinkSQL",
        "Импорт данных в Doris в реальном времени",
        "Синхронизация Kafka и MySQL с Doris"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Real-time data import / Streaming ETL -->

**Flink Doris Connector** позволяет импортировать данные, обрабатываемые Flink (например, данные, которые Flink читает из Kafka или MySQL), в Doris в реальном времени. Он подходит для загрузки данных в реальном времени и потоковой ETL-обработки.

## Сценарии использования {#applicable-scenarios}

| Сценарий | Описание |
| --- | --- |
| Загрузка данных в реальном времени | Запись данных из очередей сообщений, таких как Kafka или Pulsar, в Doris в реальном времени |
| Синхронизация баз данных | Синхронизация данных из баз данных, таких как MySQL или Oracle, с Doris через Flink CDC |
| Потоковая ETL-обработка | Выполнение вычислений в реальном времени с помощью Flink и запись результатов в Doris |

## Ограничения {#limitations}

- Необходим заранее развёрнутый **кластер Flink**.
- В Flink должна быть установлена соответствующая версия **Flink Doris Connector**.

## Порядок действий {#procedure}

Подробные инструкции по импорту данных с помощью Flink см. в документации [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector.md). В следующем минимальном примере показано, как быстро выполнить импорт с помощью Flink.

Общий процесс состоит из следующих трёх шагов:

1. Создать целевую таблицу в Doris
2. Записать данные через FlinkSQL в Flink
3. Проверить в Doris, что данные успешно импортированы

### Шаг 1: Создание таблицы в Doris {#step-1-create-a-table-in-doris}

Создайте в Doris целевую таблицу `students` для получения данных из Flink:

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

### Шаг 2: Импорт данных с помощью Flink {#step-2-import-data-with-flink}

Запустите `bin/sql-client.sh`, чтобы открыть консоль FlinkSQL, и выполните следующие операторы для создания таблицы-приёмника и записи данных:

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
| `connector` | Фиксированное значение `doris`, указывающее на использование Flink Doris Connector |
| `fenodes` | HTTP-адрес FE Doris в формате `host:http_port` |
| `table.identifier` | Идентификатор целевой таблицы в формате `database.table` |
| `username` | Имя пользователя для входа в Doris |
| `password` | Пароль для входа в Doris |
| `sink.label-prefix` | Префикс Label для задачи загрузки через Stream Load. Должен быть глобально уникальным |

### Шаг 3: Проверка импортированных данных {#step-3-check-the-imported-data}

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

Теоретически все источники данных, поддерживаемые Flink (Kafka, MySQL CDC, файловые системы, очереди сообщений и т. д.), можно использовать в качестве исходных источников: данные из них обрабатываются во Flink, а затем записываются в Doris.

**Вопрос 2: Почему значение `sink.label-prefix` должно быть уникальным?**

Flink Doris Connector выполняет импорт на основе Doris Stream Load. Для каждой транзакции требуется уникальная метка Label, чтобы гарантировать семантику Exactly-Once. Повторяющиеся метки Label вызывают конфликты при импорте.

**Вопрос 3: Какой порт следует указывать в `fenodes`?**

В `fenodes` указывается **HTTP-порт** FE Doris (по умолчанию `8030`), а не порт протокола MySQL (по умолчанию `9030`).

**Вопрос 4: Как синхронизировать данные из баз данных, таких как MySQL или Oracle, с Doris?**

Можно использовать коннектор совместно с Flink CDC. Подробнее см. в документации [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector.md).

## Связанные документы {#related-documents}

- [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector.md)
