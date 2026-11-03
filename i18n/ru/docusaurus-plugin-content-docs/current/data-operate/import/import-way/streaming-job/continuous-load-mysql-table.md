---
{
    "title": "CDC MySQL с сопоставлением SQL",
    "language": "ru",
    "sidebar_label": "Синхронизация с сопоставлением SQL",
    "description": "Используйте Streaming Job Doris и CDC Stream TVF для синхронизации таблицы MySQL с сопоставлением SQL, полными и инкрементальными позициями, SSL и обработкой удалений.",
    "keywords": [
        "Синхронизация MySQL с Doris",
        "Синхронизация с сопоставлением SQL",
        "CDC Stream TVF",
        "Streaming Job",
        "Инкрементальная синхронизация Binlog",
        "exactly-once",
        "Flink CDC",
        "INSERT INTO SELECT"
    ]
}
---

:::caution Экспериментальная функция

Непрерывная загрузка Doris является экспериментальной функцией и поддерживается начиная с Doris 4.1.5.

:::

<!-- Knowledge type: Operation steps / Configuration parameters -->
<!-- Applicable scenario: Real-time sync of a single MySQL table to Doris with column mapping or data transformation -->

Синхронизация с сопоставлением SQL реализуется через Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md) и предназначена для **существующей** таблицы Doris (`INSERT INTO tbl SELECT * FROM cdc_stream(...)`). Благодаря выразительным возможностям SQL Doris в конвейере синхронизации можно выполнять сопоставление столбцов, фильтрацию и преобразование данных. Это подходит для сценариев синхронизации в реальном времени, требующих обработки данных.

Интегрируя возможности чтения [Flink CDC](https://github.com/apache/flink-cdc), Doris считывает журнал изменений (Binlog) из MySQL и выполняет **полную + инкрементальную** синхронизацию исходной таблицы с целевой. Если нужно, чтобы Doris автоматически создавал нижестоящие таблицы и синхронизировал группу таблиц по базам данных, см. [Синхронизация MySQL CDC с автоматическим созданием таблиц](./continuous-load-mysql-database.md).

### Сценарии применения {#applicable-scenarios}

- Непрерывная синхронизация одной таблицы MySQL с Doris, когда схема целевой таблицы уже спланирована
- Во время синхронизации требуется исключение столбцов, сопоставление столбцов, переименование полей или преобразование данных
- Интеграция данных в реальном времени, требующая семантики exactly-once на всём пути обработки

### Предварительные условия {#prerequisites}

| Пункт | Описание |
| ------ | ---- |
| Версия Doris | 4.1.5 и выше |
| Тип таблицы | Исходная таблица выше по потоку должна иметь первичный ключ; целевая таблица Doris должна использовать модель Unique Key |
| Права пользователя | Требуется привилегия `Load` |
| Конфигурация MySQL | На стороне MySQL должен быть включён Binlog. См. [Руководство по настройке](./continuous-load-overview.md#supported-data-sources-and-sync-modes) |
| Гарантия семантики | Поддерживается семантика exactly-once |

## Быстрый старт {#quick-start}

Ниже приведён минимальный работоспособный пример полного процесса: создание задания и проверка его состояния.

### Шаг 1. Создание задания импорта {#step-1-create-the-import-job}

Используйте [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md), чтобы создать задание непрерывного импорта:

```sql
CREATE JOB mysql_single_sync
ON STREAMING
DO
INSERT INTO db1.tbl1
SELECT * FROM cdc_stream(
    "type" = "mysql",
    "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
    "driver_url" = "mysql-connector-java-8.0.25.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver",
    "user" = "root",
    "password" = "123456",
    "database" = "source_db",
    "table" = "source_table",
    "offset" = "initial"
)
```

### Шаг 2. Проверка статуса импорта {#step-2-check-the-import-status}

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

### Шаг 3. Операции с заданием {#step-3-job-operations}

Общие операции (приостановка, возобновление, удаление, просмотр задач и т. д.) описаны в [Обзоре непрерывного импорта](./continuous-load-overview.md).

## Справочник параметров {#parameter-reference}

### Параметры источника данных {#data-source-parameters}

CDC Stream TVF поддерживает следующие параметры источника данных MySQL.

| Параметр | Обязательный | По умолчанию | Описание |
| --- | --- | --- | --- |
| `type` | Да | - | Тип источника данных. Укажите `mysql`. |
| `jdbc_url` | Да | - | Строка подключения MySQL JDBC. |
| `driver_url` | Да | - | Путь к JAR-файлу драйвера JDBC. Поддерживаются имя файла, локальный абсолютный путь или URL HTTP. Подробнее см. [Обзор JDBC Catalog](../../../../lakehouse/catalogs/jdbc-catalog-overview.md). |
| `driver_class` | Да | - | Имя класса драйвера JDBC, например `com.mysql.cj.jdbc.Driver`. |
| `user` | Да | - | Имя пользователя базы данных. |
| `password` | Да | - | Пароль базы данных. |
| `database` | Да | - | Имя базы данных MySQL. |
| `table` | Да | - | Имя таблицы для синхронизации. Каждое задание SQL Mapping поддерживает одну исходную таблицу. |
| `offset` | Да | - | Начальная позиция. `initial`: полная и инкрементальная синхронизация; `snapshot`: только полная синхронизация; `earliest`: запуск с самой ранней доступной позиции Binlog; `latest`: синхронизация только изменений после запуска задания. Также можно указать точную позицию JSON, например `{"file":"binlog.000001","pos":"154"}` или `{"gtids":"<gtid_set>"}`. |
| `snapshot_split_size` | Нет | `40960` | Размер split в строках. Во время полной синхронизации таблица делится на несколько split. Должно быть положительным целым числом. |
| `snapshot_parallelism` | Нет | `1` | Параллелизм этапа полной синхронизации, то есть максимальное число split, планируемых Task одновременно. Должно быть положительным целым числом. |
| `skip_snapshot_backfill` | Нет | `false` | Следует ли пропускать обратное заполнение Binlog во время снимка. При значении `true` используется семантика at-least-once. |
| `server_id` | Нет | Автоматически генерируется | Идентификатор сервера ридера MySQL CDC. Поддерживается одно значение, например `5400`, или замкнутый диапазон, например `5400-5408`. Ширина диапазона должна быть больше или равна `snapshot_parallelism`. |
| `ssl_mode` | Нет | `disable` | Режим SSL. Допустимые значения: `disable`, `require` и `verify-ca`. |
| `ssl_rootcert` | Требуется при условии | - | Файл сертификата CA в формате `FILE:<file_name>`. Обязателен, если `ssl_mode` имеет значение `verify-ca`. Сначала загрузите файл с помощью [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md). |
| `include_delete_sign` | Нет | `false` | Следует ли TVF дополнительно выводить столбец `__DORIS_DELETE_SIGN__`. Установите `true`, чтобы синхронизировать операции DELETE из источника как удаления в таблице Doris с первичным ключом. |

Если `include_delete_sign` включён, целевая таблица должна быть таблицей Unique Key с Merge-on-Write, а `__DORIS_DELETE_SIGN__` необходимо явно сопоставить и в списке целевых столбцов INSERT, и в списке SELECT:

```sql
CREATE JOB mysql_cdc_with_delete
ON STREAMING
DO
INSERT INTO db1.target_table (id, value, __DORIS_DELETE_SIGN__)
SELECT id, value, __DORIS_DELETE_SIGN__
FROM cdc_stream(
    "type" = "mysql",
    "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
    "driver_url" = "mysql-connector-java-8.0.25.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver",
    "user" = "root",
    "password" = "123456",
    "database" = "source_db",
    "table" = "source_table",
    "offset" = "initial",
    "include_delete_sign" = "true"
);
```

### Параметры конфигурации задания {#job-configuration-parameters}

Установите следующие параметры через `CREATE JOB ... PROPERTIES (...)`:

| Параметр | По умолчанию | Описание |
| --- | --- | --- |
| `max_interval` | `10` | Интервал планирования простоя в секундах, когда новые данные из источника выше по потоку отсутствуют. Должен быть целым числом не менее 1. |
| `compute_group` | Текущая сессия или вычислительная группа пользователя по умолчанию | Поддерживается только в режиме разделения вычислений и хранения. Указывает вычислительную группу, в которой выполняется задание. Пользователь должен иметь привилегию USAGE для этой вычислительной группы. |
| `session.<variable_name>` | Значение соответствующей переменной сеанса по умолчанию | Задаёт переменную сеанса для задачи INSERT. Переменные загрузки см. в разделе [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters). |

Свойство задания `offset`, используемое для сброса позиции CDC через `ALTER JOB`, и полные ограничения описаны в разделе [Общие параметры конфигурации загрузки заданий](./continuous-load-overview.md#job-common-load-configuration-parameters). Начальную позицию нового задания необходимо задать в `cdc_stream(...)`.

## FAQ {#faq}

**Q1: Чем отличается синхронизация с сопоставлением SQL от синхронизации с автоматическим созданием таблиц?**

- Синхронизация с сопоставлением SQL: целевая таблица Doris должна быть **создана заранее**. Поддерживаются сопоставление столбцов и преобразование данных; этот вариант подходит для сценариев детальной обработки.
- Синхронизация с автоматическим созданием таблиц: Doris **автоматически создаёт** нижестоящие таблицы и синхронизирует их целиком по базам данных. Подробнее см. [Синхронизация MySQL CDC с автоматическим созданием таблиц](./continuous-load-mysql-database.md).

**Q2: Поддерживаются ли таблицы без первичного ключа в качестве целевой таблицы?**

Исходная таблица выше по потоку должна иметь первичный ключ, а целевая таблица Doris в настоящее время должна использовать модель Unique Key.

**Q3: Как синхронизировать только инкрементальные данные без исторических полных данных?**

Установите для параметра `offset` значение `latest`. Задание пропустит этап полной синхронизации и будет синхронизировать только инкрементальные данные Binlog.

**Q4: Как оптимизировать работу, если полная синхронизация выполняется слишком медленно?**

Для повышения пропускной способности на этапе полной синхронизации можно изменить следующие два параметра:

- `snapshot_split_size`: увеличьте число строк в одном split.
- `snapshot_parallelism`: увеличьте параллелизм split, планируемых одним Task.

При изменении `snapshot_parallelism`, если также настроен диапазон `server_id`, убедитесь, что количество идентификаторов в диапазоне не меньше значения параллелизма.

## Связанные документы {#related-documents}

- [Обзор непрерывного импорта](./continuous-load-overview.md)
- [Синхронизация MySQL CDC с автоматическим созданием таблиц](./continuous-load-mysql-database.md)
- [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md)
