---
{
    "title": "CREATE STREAMING JOB",
    "language": "ru",
    "description": "Doris Streaming Job представляет собой задачу непрерывной загрузки, основанную на подходе Job. После отправки Job Doris непрерывно выполняет задачу загрузки, запрашивая данные из TVF или вышестоящих источников данных в реальном времени и записывая их в таблицы Doris."
}
---

## Описание {#description}

Doris Streaming Job представляет собой задачу непрерывной загрузки, основанную на подходе Job. После отправки Job Doris непрерывно выполняет задачу загрузки, запрашивая данные из TVF или вышестоящих источников данных в реальном времени и записывая их в таблицы Doris.

Поддерживаются два режима:

- **Режим TVF**: использует синтаксис `DO INSERT INTO ... SELECT FROM TVF()` для непрерывной записи данных TVF в одну указанную таблицу Doris. Поддерживает [S3 TVF](../../sql-functions/table-valued-functions/s3.md) и [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md).
- **Режим CDC для нескольких таблиц**: использует синтаксис `FROM <sourceType> TO DATABASE` для непрерывной синхронизации полных и инкрементальных данных из нескольких таблиц исходной базы данных в Doris, автоматически создавая целевые таблицы при первой синхронизации.

Подробные сведения об использовании см. в разделе [Непрерывная загрузка](../../../data-operate/import/import-way/streaming-job/continuous-load-overview.md).

## Синтаксис {#syntax}

### Режим TVF {#tvf-mode}

```SQL
CREATE JOB <job_name>
[ PROPERTIES (
    <job_property>
    [ , ... ]
    )
]
ON STREAMING
[ COMMENT <comment> ]
DO <Insert_Command> 
```

### Режим CDC для нескольких таблиц {#multi-table-cdc-mode}

```SQL
CREATE JOB <job_name>
[ PROPERTIES (
    <job_property>
    [ , ... ]
    )
]
ON STREAMING
[ COMMENT <comment> ]
FROM <sourceType> (
    <source_property>
    [ , ... ]
)
TO DATABASE <target_db> (
    <target_property>
    [ , ... ]
)
```

## Обязательные параметры {#required-parameters}

**1. `<job_name>`**
> Имя задачи, однозначно идентифицирующее событие в базе данных. Имя задачи должно быть глобально уникальным; если задача с таким именем уже существует, будет выдана ошибка.

**2. `<Insert_Command>`** (режим TVF)
> Предложение DO задаёт операцию, выполняемую при запуске задачи, то есть оператор INSERT INTO SELECT FROM TVF. Поддерживает [S3 TVF](../../sql-functions/table-valued-functions/s3.md) и [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md).

**3. `<sourceType>`** (режим CDC для нескольких таблиц)
> Поддерживаемые типы источников данных: в настоящее время поддерживаются `MYSQL` и `POSTGRES`.

**4. `<source_property>`** (режим CDC для нескольких таблиц)

| Параметр       | По умолчанию | Описание                                                     |
| -------------- | ------- | ------------------------------------------------------------ |
| jdbc_url       | -       | Строка подключения JDBC (MySQL/PostgreSQL)                    |
| driver_url     | -       | Путь к jar-файлу драйвера JDBC                                |
| driver_class   | -       | Имя класса драйвера JDBC                                     |
| user           | -       | Имя пользователя базы данных                                 |
| password       | -       | Пароль базы данных                                           |
| database       | -       | Имя базы данных                                              |
| schema         | -       | Имя схемы (PostgreSQL)                                       |
| include_tables | -       | Таблицы для синхронизации, перечисленные через запятую. Если параметр не указан, по умолчанию синхронизируются все таблицы. |
| offset         | latest  | `latest`: только инкрементальная синхронизация (по умолчанию); `initial`: полная и инкрементальная синхронизация |
| snapshot_split_size | 40960 (8096 до 4.1.4) | Размер фрагмента (в строках). При полной синхронизации таблица разделяется на несколько фрагментов. |
| snapshot_parallelism | 1   | Степень параллелизма на этапе полной синхронизации, то есть максимальное количество фрагментов на задачу. |

**5. `<target_db>`** (режим CDC для нескольких таблиц)
> Имя целевой базы данных Doris для загрузки данных.

**6. `<target_property>`** (режим CDC для нескольких таблиц)

| Параметр                        | По умолчанию | Описание                                                     |
| ------------------------------- | ------- | ------------------------------------------------------------ |
| table.create.properties.*       | -       | Свойства таблицы при создании, например replication_num      |
| load.strict_mode                | -       | Включать ли строгий режим. По умолчанию отключён.             |
| load.max_filter_ratio           | -       | Максимально допустимая доля отфильтрованных строк в пределах окна выборки. Значение должно быть от 0 до 1 включительно. Значение по умолчанию: 0, что означает недопустимость ошибок. Окно выборки равно max_interval * 10. Если в пределах этого окна отношение количества ошибочных строк к общему количеству строк превышает max_filter_ratio, запланированная задача будет приостановлена и потребуется вручную устранить проблемы с качеством данных. |

## Необязательные параметры {#optional-parameters}

**1. `<job_property>`**

| Параметр           | По умолчанию | Описание                                                     |
| ------------------ | ------- | ------------------------------------------------------------ |
| session.*          | -       | Поддерживает настройку всех сеансовых переменных в job_properties (только в режиме TVF) |
| s3.max_batch_files | 256     | Запускает загрузку с записью данных, когда количество накопленных файлов достигает этого значения (только для S3 TVF) |
| s3.max_batch_bytes | 10737418240 | Запускает загрузку с записью данных, когда объём накопленных данных (в байтах) достигает этого значения. Принимается только целое число байтов, например `10737418240`; суффикс единицы измерения, например `10G`, не поддерживается. Допустимый диапазон: 100MB–10GB, то есть 104857600–10737418240. (Только для S3 TVF) |
| max_interval       | 10      | Интервал ожидания между запусками задачи в секундах при отсутствии новых файлов или данных в источнике. Принимается только целое число (количество секунд), например `10`; суффикс единицы измерения, например `10s`, не поддерживается. Значение должно быть >= 1 |

## Управление привилегиями {#privilege-control}

Пользователь, выполняющий эту команду SQL, должен иметь как минимум следующие привилегии:

| Привилегия  | Объект      | Примечания                            |
|:------------|:------------|:--------------------------------------|
| LOAD_PRIV   | База данных | В настоящее время для этой операции поддерживается только привилегия **LOAD** |

## Примечания {#notes}

- TASK хранит только последние 100 записей.

## Примеры {#examples}

### Режим TVF {#tvf-mode-1}

- Создание задачи, которая непрерывно отслеживает файлы в указанном каталоге S3 и загружает данные из файлов CSV в db1.tbl1.

    ```sql
    CREATE JOB my_job
    ON STREAMING
    DO 
    INSERT INTO db1.`tbl1`
    SELECT * FROM S3
    (
        "uri" = "s3://bucket/s3/demo/*.csv",
        "format" = "csv",
        "column_separator" = ",",
        "s3.endpoint" = "https://s3.ap-southeast-1.amazonaws.com",
        "s3.region" = "ap-southeast-1",
        "s3.access_key" = "",
        "s3.secret_key" = ""
    );
    ```

- Создание задачи, которая непрерывно синхронизирует одну таблицу MySQL с Doris с помощью CDC Stream TVF.

    ```sql
    CREATE JOB mysql_cdc_job
    ON STREAMING
    DO
    INSERT INTO db1.target_table
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
    );
    ```

- Создание задачи, которая непрерывно синхронизирует одну таблицу PostgreSQL с Doris с помощью CDC Stream TVF.

    ```sql
    CREATE JOB pg_cdc_job
    ON STREAMING
    DO
    INSERT INTO db1.target_table
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
    );
    ```

### Режим CDC для нескольких таблиц {#multi-table-cdc-mode-1}

- Создание задачи для синхронизации таблиц user_info и order_info из источника MySQL в базу данных target_test_db начиная с исходного состояния.

    ```sql
    CREATE JOB multi_table_sync
    ON STREAMING
    FROM MYSQL (
            "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
            "driver_url" = "mysql-connector-java-8.0.25.jar",
            "driver_class" = "com.mysql.cj.jdbc.Driver",
            "user" = "root",
            "password" = "123456",
            "database" = "test",
            "include_tables" = "user_info,order_info",
            "offset" = "initial"
    )
    TO DATABASE target_test_db (
        "table.create.properties.replication_num" = "1"
    )
    ```

- Создание задачи для непрерывной синхронизации инкрементальных данных из таблицы test_tbls в источнике PostgreSQL в базу данных target_test_db.

    ```sql
    CREATE JOB test_postgres_job
    ON STREAMING
    FROM POSTGRES (
        "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
        "driver_url" = "postgresql-42.5.1.jar",
        "driver_class" = "org.postgresql.Driver",
        "user" = "postgres",
        "password" = "postgres",
        "database" = "postgres",
        "schema" = "public",
        "include_tables" = "test_tbls", 
        "offset" = "latest"
    )
    TO DATABASE target_test_db (
        "table.create.properties.replication_num" = "1"
    )
    ```

## Конфигурация {#config}

**fe.conf**

| Параметр                              | По умолчанию | Описание                                    |
| -------------------------------------- | ------- | ------------------------------------------- |
| max_streaming_job_num                  | 1024    | Максимальное количество задач Streaming     |
| job_streaming_task_exec_thread_num     | 10      | Количество потоков для StreamingTask        |
| max_streaming_task_show_count          | 100     | Максимальное количество записей StreamingTask в памяти |
