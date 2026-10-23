---
{
    "title": "CDC PostgreSQL с сопоставлением средствами SQL",
    "language": "ru",
    "sidebar_label": "Синхронизация с сопоставлением средствами SQL",
    "description": "Используйте Doris Job + CDC Stream TVF для непрерывной синхронизации таблицы PostgreSQL с Doris с сопоставлением столбцов, преобразованием данных и семантикой exactly-once.",
    "keywords": [
        "PostgreSQL CDC",
        "Синхронизация PostgreSQL в реальном времени",
        "Doris CDC Stream",
        "Инкрементальная синхронизация WAL",
        "Flink CDC",
        "exactly-once",
        "Streaming Job",
        "Синхронизация с сопоставлением средствами SQL"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: PostgreSQL real-time data sync / single-table CDC ingestion with SQL mapping -->

Синхронизация с сопоставлением средствами SQL реализована с помощью Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md). Данные записываются в существующую таблицу Doris (`INSERT INTO tbl SELECT * FROM cdc_stream(...)`). SQL в Doris позволяет сопоставлять столбцы, фильтровать и преобразовывать данные. Этот подход подходит для сценариев синхронизации в реальном времени, в которых данные необходимо обработать перед записью.

> Синхронизация с сопоставлением средствами SQL поддерживается начиная с версии 4.1.0.

Благодаря интеграции возможностей чтения [Flink CDC](https://github.com/apache/flink-cdc) Doris считывает журналы изменений (WAL) PostgreSQL и выполняет полную и инкрементальную синхронизацию исходной таблицы с целевой. Если вы хотите, чтобы Doris автоматически создавал целевые таблицы и синхронизировал группы таблиц на уровне базы данных, см. [CDC PostgreSQL с автоматическим созданием таблиц](./continuous-load-postgresql-database.md).

### Сценарии использования {#use-cases}

-   Загрузка одной таблицы в хранилище в реальном времени, когда перед записью требуется отбор столбцов, фильтрация или преобразование с помощью выражений.
-   Целевая таблица Doris уже существует, и вы хотите явно задавать сопоставление полей средствами SQL.
-   Высокие требования к согласованности данных, для выполнения которых необходима семантика exactly-once.

### Предварительные требования {#prerequisites}

Перед созданием задания убедитесь в следующем:

1. На стороне PostgreSQL включена логическая репликация. Подробности см. в [Руководстве по настройке](./continuous-load-overview.md#supported-data-sources-and-sync-modes).
2. Текущий пользователь имеет привилегию `Load`.
3. В исходной таблице задан первичный ключ (в настоящее время поддерживается синхронизация только таблиц с первичным ключом).
4. В Doris заранее создана целевая таблица Unique Key, и её схема совместима с SQL-запросом сопоставления.

### Примечания {#notes}

-   Поддерживается семантика exactly-once.
-   В настоящее время поддерживается синхронизация только таблиц с первичным ключом.
-   Требуется привилегия `Load`.
-   На стороне PostgreSQL должна быть включена логическая репликация. См. [Руководство по настройке](./continuous-load-overview.md#supported-data-sources-and-sync-modes).

## Быстрый старт {#quick-start}

Процесс состоит из двух шагов: создание задания непрерывной загрузки и проверка его состояния.

### Шаг 1: создание задания загрузки {#step-1-create-the-load-job}

Используйте [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) для создания задания непрерывной загрузки, которое синхронизирует `public.source_table` из PostgreSQL с `db1.tbl1` в Doris:

```sql
CREATE JOB pg_single_sync
ON STREAMING
DO
INSERT INTO db1.tbl1
SELECT * FROM cdc_stream(
    "type" = "postgres",
    "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url" = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver",
    "user" = "postgres",
    "password" = "postgres",
    "database" = "postgres",
    "schema" = "public",
    "table" = "source_table",
    "offset" = "initial"
)
```

### Шаг 2: проверка состояния загрузки {#step-2-check-the-load-status}

Используйте табличную функцию `jobs` для проверки состояния выполнения заданий типа Streaming:

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

Другие типовые операции (приостановка, возобновление, удаление, просмотр задач и т. д.) описаны в [Обзоре непрерывной загрузки](./continuous-load-overview.md).

## Справочник параметров {#parameter-reference}

<!-- Knowledge type: Configuration parameters -->

### Параметры источника данных {#data-source-parameters}

Параметры источника данных задаются через TVF `cdc_stream(...)`. Они описывают таблицу PostgreSQL, которую нужно синхронизировать, и поведение при чтении.

| Параметр | Обязательный | Значение по умолчанию | Описание |
| --- | --- | --- | --- |
| `type` | Да | - | Тип источника данных. Укажите `postgres`. |
| `jdbc_url` | Да | - | Строка подключения JDBC к PostgreSQL. |
| `driver_url` | Да | - | Путь к jar-файлу драйвера JDBC. Поддерживаются имя файла, абсолютный локальный путь и HTTP URL. Подробности см. в [Обзоре JDBC Catalog](../../../../lakehouse/catalogs/jdbc-catalog-overview.md). |
| `driver_class` | Да | - | Имя класса драйвера JDBC, например `org.postgresql.Driver`. |
| `user` | Да | - | Имя пользователя базы данных. |
| `password` | Да | - | Пароль базы данных. |
| `database` | Нет | Имя базы данных в JDBC URL | Имя базы данных PostgreSQL. Если значение указано явно, оно переопределяет имя базы данных в JDBC URL. Размер после кодирования не должен превышать 63 байта в UTF-8. |
| `schema` | Да | - | Имя схемы. |
| `table` | Да | - | Имя таблицы для синхронизации. Каждое задание SQL Mapping поддерживает одну исходную таблицу. |
| `offset` | Да | - | Начальное смещение. `initial`: полная и инкрементальная синхронизация; `snapshot`: только полная синхронизация; `latest`: синхронизация только изменений, появившихся после запуска задания. Также можно указать точное смещение в формате JSON, например `{"lsn":"12345678"}`. PostgreSQL не поддерживает `earliest`. |
| `snapshot_split_size` | Нет | `40960` (`8096` до 4.1.4) | Размер фрагмента в строках. При полной синхронизации таблица делится на несколько фрагментов. Должен быть положительным целым числом. |
| `snapshot_parallelism` | Нет | `1` | Уровень параллелизма на этапе полной синхронизации, то есть максимальное количество фрагментов, которые одна Task планирует одновременно. Должен быть положительным целым числом. |
| `skip_snapshot_backfill` | Нет | `false` | Пропускать ли дозагрузку из WAL во время создания снимка. При значении `true` используется семантика at-least-once. |
| `slot_name` | Нет | `doris_cdc_<job_id>` | Имя слота логической репликации. Имя может содержать только строчные буквы, цифры и знаки подчёркивания, не может начинаться с цифры и ограничено 63 символами. Пользовательский слот необходимо создать заранее; Doris его не удаляет. |
| `publication_name` | Нет | `doris_pub_<job_id>` | Имя публикации. Правила именования такие же, как для `slot_name`. Пользовательская публикация должна быть создана заранее и включать текущую исходную таблицу; Doris её не удаляет. |
| `ssl_mode` | Нет | `disable` | Режим SSL. Допустимые значения: `disable`, `require` и `verify-ca`. |
| `ssl_rootcert` | Обязателен при определённых условиях | - | Файл сертификата CA в формате `FILE:<file_name>`. Обязателен, если `ssl_mode` имеет значение `verify-ca`. Сначала загрузите файл с помощью [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md). |
| `include_delete_sign` | Нет | `false` | Нужно ли TVF дополнительно выводить столбец `__DORIS_DELETE_SIGN__`. Укажите `true`, чтобы операции DELETE в источнике синхронизировались как удаления в таблице Doris с первичным ключом. |

При включении `include_delete_sign` целевая таблица должна использовать модель Unique Key с Merge-on-Write, а `__DORIS_DELETE_SIGN__` необходимо явно указать и в списке целевых столбцов INSERT, и в списке SELECT:

```sql
CREATE JOB pg_cdc_with_delete
ON STREAMING
DO
INSERT INTO db1.target_table (id, value, __DORIS_DELETE_SIGN__)
SELECT id, value, __DORIS_DELETE_SIGN__
FROM cdc_stream(
    "type" = "postgres",
    "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url" = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver",
    "user" = "postgres",
    "password" = "postgres",
    "schema" = "public",
    "table" = "source_table",
    "offset" = "initial",
    "include_delete_sign" = "true"
);
```

Если вы задаёте собственное значение `slot_name` или `publication_name`, подготовьте соответствующий ресурс до создания Job. При удалении Job Doris сохраняет ресурсы, предоставленные пользователем.

### Параметры конфигурации задания {#job-configuration-parameters}

Задайте следующие параметры с помощью `CREATE JOB ... PROPERTIES (...)`:

| Параметр | Значение по умолчанию | Описание |
| --- | --- | --- |
| `max_interval` | `10` | Интервал планирования при отсутствии новых данных в источнике, в секундах. Должен быть целым числом, большим или равным 1. |
| `compute_group` | Вычислительная группа текущей сессии или группа пользователя по умолчанию | Поддерживается только в режиме с разделением вычислений и хранения. Задаёт вычислительную группу, в которой выполняется задание. Пользователь должен иметь привилегию USAGE для этой вычислительной группы. |
| `session.<variable_name>` | Значение соответствующей переменной сессии по умолчанию | Задаёт переменную сессии для задачи INSERT. Сведения о переменных загрузки см. в [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters). |

Свойство Job `offset`, используемое для сброса позиции CDC через `ALTER JOB`, и все ограничения на его использование описаны в разделе [Общие параметры конфигурации загрузки заданий](./continuous-load-overview.md#job-common-load-configuration-parameters). Начальную позицию для нового задания необходимо задавать в `cdc_stream(...)`.
