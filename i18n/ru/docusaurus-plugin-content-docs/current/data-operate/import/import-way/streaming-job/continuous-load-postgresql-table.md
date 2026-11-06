---
{
    "title": "PostgreSQL CDC с сопоставлением SQL",
    "language": "ru",
    "sidebar_label": "Синхронизация с сопоставлением SQL",
    "description": "Используйте Doris Job и CDC Stream TVF для непрерывной синхронизации таблицы PostgreSQL с Doris с сопоставлением столбцов, преобразованием данных и семантикой exactly-once.",
    "keywords": [
        "PostgreSQL CDC",
        "Синхронизация PostgreSQL в реальном времени",
        "Doris CDC Stream",
        "Инкрементальная синхронизация WAL",
        "Flink CDC",
        "exactly-once",
        "Streaming Job",
        "Синхронизация с сопоставлением SQL"
    ]
}
---

:::caution Экспериментальная функция

Непрерывная загрузка Doris является экспериментальной функцией и поддерживается начиная с Doris 4.1.5.

:::

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: PostgreSQL real-time data sync / single-table CDC ingestion with SQL mapping -->

Синхронизация с сопоставлением SQL реализуется посредством Job и [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md). Целевым объектом является уже существующая таблица Doris (`INSERT INTO tbl SELECT * FROM cdc_stream(...)`). SQL Doris предоставляет возможности для сопоставления столбцов, фильтрации и преобразования данных. Этот подход подходит для сценариев синхронизации в реальном времени, где данные необходимо обработать перед записью.

Интегрируя возможность чтения [Flink CDC](https://github.com/apache/flink-cdc), Doris считывает журналы изменений (WAL) из PostgreSQL и выполняет полную и инкрементальную синхронизацию исходной таблицы с целевой. Если требуется, чтобы Doris автоматически создавал целевые таблицы и синхронизировал группу таблиц по каждой базе данных, см. [PostgreSQL CDC с автоматическим созданием таблиц](./continuous-load-postgresql-database.md).

### Сценарии использования {#use-cases}

-   Приём данных одной таблицы в хранилище в реальном времени, когда перед записью требуется удаление ненужных столбцов, фильтрация или преобразование на основе выражений.
-   Целевая таблица Doris уже существует, и требуется явно управлять сопоставлением полей с помощью SQL.
-   Высокие требования к согласованности, требующие семантики exactly-once.

### Предварительные условия {#prerequisites}

Перед созданием задания убедитесь в следующем:

1. На стороне PostgreSQL включена логическая репликация. Подробности см. в [руководстве по настройке](./continuous-load-overview.md#supported-data-sources-and-sync-modes).
2. Текущий пользователь имеет привилегию `Load`.
3. Исходная таблица является таблицей с первичным ключом (в настоящее время поддерживается синхронизация только таких таблиц).
4. Целевая таблица Unique Key заранее создана в Doris, а её схема совместима с SQL сопоставления.

### Примечания {#notes}

-   Поддерживается семантика exactly-once.
-   В настоящее время поддерживается только синхронизация таблиц с первичным ключом.
-   Требуется привилегия `Load`.
-   На стороне PostgreSQL должна быть включена логическая репликация. См. [руководство по настройке](./continuous-load-overview.md#supported-data-sources-and-sync-modes).

## Быстрый запуск {#quick-start}

Общий процесс состоит из двух шагов: создать задание непрерывной загрузки, затем проверить его состояние.

### Шаг 1. Создание задания загрузки {#step-1-create-the-load-job}

Используйте [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md), чтобы создать задание непрерывной загрузки, синхронизирующее `public.source_table` из PostgreSQL с `db1.tbl1` в Doris:

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

### Шаг 2. Проверка состояния загрузки {#step-2-check-the-load-status}

Используйте табличную функцию `jobs`, чтобы проверить состояние выполнения заданий типа Streaming:

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

Другие распространённые операции (приостановка, возобновление, удаление, просмотр задач и т. д.) описаны в [Обзоре непрерывной загрузки](./continuous-load-overview.md).

## Справочник параметров {#parameter-reference}

<!-- Knowledge type: Configuration parameters -->

### Параметры источника данных {#data-source-parameters}

Параметры источника данных задаются через TVF `cdc_stream(...)`. Они описывают синхронизируемую таблицу PostgreSQL и поведение чтения.

| Параметр | Обязательный | Значение по умолчанию | Описание |
| --- | --- | --- | --- |
| `type` | Да | - | Тип источника данных. Укажите `postgres`. |
| `jdbc_url` | Да | - | Строка подключения PostgreSQL JDBC. |
| `driver_url` | Да | - | Путь к jar-файлу драйвера JDBC. Поддерживаются имя файла, локальный абсолютный путь или URL HTTP. Подробности см. в [Обзоре JDBC Catalog](../../../../lakehouse/catalogs/jdbc-catalog-overview.md). |
| `driver_class` | Да | - | Имя класса драйвера JDBC, например `org.postgresql.Driver`. |
| `user` | Да | - | Имя пользователя базы данных. |
| `password` | Да | - | Пароль базы данных. |
| `database` | Нет | Имя базы данных в JDBC URL | Имя базы данных PostgreSQL. При явной установке это значение заменяет имя базы данных в JDBC URL. После кодирования UTF-8 длина не должна превышать 63 байта. |
| `schema` | Да | - | Имя схемы. |
| `table` | Да | - | Имя синхронизируемой таблицы. Каждое задание SQL Mapping поддерживает одну исходную таблицу. |
| `offset` | Да | - | Начальная позиция. `initial`: полная и инкрементальная синхронизация; `snapshot`: только полная синхронизация; `latest`: синхронизация только изменений после запуска задания. Можно также указать точную позицию JSON, например `{"lsn":"12345678"}`. PostgreSQL не поддерживает `earliest`. |
| `snapshot_split_size` | Нет | `40960` | Размер split в строках. При полной синхронизации таблица делится на несколько split. Должно быть положительным целым числом. |
| `snapshot_parallelism` | Нет | `1` | Параллелизм этапа полной синхронизации, то есть максимальное число split, планируемых Task одновременно. Должно быть положительным целым числом. |
| `skip_snapshot_backfill` | Нет | `false` | Нужно ли пропускать заполнение WAL во время снимка. При значении `true` используется семантика at-least-once. |
| `slot_name` | Нет | `doris_cdc_<job_id>` | Имя слота логической репликации. Имя может содержать только строчные буквы, цифры и символы подчёркивания, не может начинаться с цифры и ограничено 63 символами. Пользовательский слот необходимо создать заранее; Doris не удаляет его. |
| `publication_name` | Нет | `doris_pub_<job_id>` | Имя публикации. Правила именования такие же, как для `slot_name`. Пользовательскую публикацию необходимо создать заранее и включить в неё текущую исходную таблицу; Doris её не удаляет. |
| `ssl_mode` | Нет | `disable` | Режим SSL. Допустимые значения: `disable`, `require` и `verify-ca`. |
| `ssl_rootcert` | Условно обязательно | - | Файл сертификата CA в формате `FILE:<file_name>`. Обязателен, если `ssl_mode` равен `verify-ca`. Сначала загрузите файл с помощью [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md). |
| `include_delete_sign` | Нет | `false` | Нужно ли TVF дополнительно выводить столбец `__DORIS_DELETE_SIGN__`. Установите `true`, чтобы синхронизировать операции DELETE из источника как удаления в таблице Doris с первичным ключом. |

При включении `include_delete_sign` целевая таблица должна быть таблицей Unique Key с Merge-on-Write, а `__DORIS_DELETE_SIGN__` необходимо явно сопоставить и в списке целевых столбцов INSERT, и в списке SELECT:

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

При настройке собственного `slot_name` или `publication_name` подготовьте соответствующий ресурс до создания Job. После удаления Job Doris сохраняет ресурсы, предоставленные пользователем.

### Параметры конфигурации Job {#job-configuration-parameters}

Следующие параметры задаются через `CREATE JOB ... PROPERTIES (...)`:

| Параметр | Значение по умолчанию | Описание |
| --- | --- | --- |
| `max_interval` | `10` | Интервал планирования простоя в секундах, когда новые данные из источника отсутствуют. Должен быть целым числом не меньше 1. |
| `compute_group` | Текущая сессия или вычислительная группа пользователя по умолчанию | Поддерживается только в режиме разделения вычислений и хранения. Указывает вычислительную группу, в которой выполняется задание. Пользователь должен иметь привилегию USAGE для этой вычислительной группы. |
| `session.<variable_name>` | Значение соответствующей переменной сеанса по умолчанию | Задаёт переменную сеанса для задачи INSERT. Переменные загрузки см. в [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters). |

Описание свойства Job `offset`, используемого для сброса позиции CDC через `ALTER JOB`, и все ограничения см. в [Обзоре непрерывной загрузки](./continuous-load-overview.md#job-common-load-configuration-parameters). Начальную позицию для нового задания необходимо задать в `cdc_stream(...)`.
