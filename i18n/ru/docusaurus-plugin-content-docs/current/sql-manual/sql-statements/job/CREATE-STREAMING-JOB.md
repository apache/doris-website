---
{
    "title": "CREATE STREAMING JOB",
    "language": "ru",
    "description": "Используйте CREATE STREAMING JOB для непрерывной загрузки данных из TVF или синхронизации таблиц MySQL и PostgreSQL с Doris."
}
---

## Описание {#description}

Doris Streaming Job представляет собой задачу непрерывной загрузки на основе механизма Job. После отправки Job система Doris непрерывно выполняет задание загрузки, в реальном времени выполняя запросы к TVF или источникам данных и записывая данные в таблицы Doris.

Поддерживаются два режима:

- **Режим TVF**: использует синтаксис `DO INSERT INTO ... SELECT FROM TVF()` для непрерывной записи данных TVF в одну указанную таблицу Doris. Поддерживает [S3 TVF](../../sql-functions/table-valued-functions/s3.md) и [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md).
- **Режим CDC для нескольких таблиц**: использует синтаксис `FROM <sourceType> TO DATABASE` для непрерывной синхронизации полных и инкрементальных данных из нескольких таблиц исходной базы данных с Doris, автоматически создавая целевые таблицы при первой синхронизации.

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
> Имя задания, однозначно определяющее событие в базе данных. Имя задания должно быть глобально уникальным; если задание с таким именем уже существует, будет выдана ошибка.

**2. `<Insert_Command>`** (режим TVF)
> Предложение DO задаёт операцию, выполняемую при срабатывании задания, то есть оператор INSERT INTO SELECT FROM TVF. Поддерживаются [S3 TVF](../../sql-functions/table-valued-functions/s3.md) и [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md).

**3. `<sourceType>`** (режим CDC для нескольких таблиц)
> В настоящее время поддерживаются следующие типы источников данных: `MYSQL` и `POSTGRES`.

**4. `<source_property>`** (режим CDC для нескольких таблиц)

| Параметр | Применимые источники | По умолчанию | Описание |
| --- | --- | --- | --- |
| `jdbc_url` | MySQL, PostgreSQL | - | Обязательный параметр. Строка подключения JDBC. |
| `driver_url` | MySQL, PostgreSQL | - | Обязательный параметр. Путь к jar-файлу драйвера JDBC. |
| `driver_class` | MySQL, PostgreSQL | - | Обязательный параметр. Имя класса драйвера JDBC. |
| `user` | MySQL, PostgreSQL | - | Обязательный параметр. Имя пользователя базы данных. |
| `password` | MySQL, PostgreSQL | - | Обязательный параметр. Пароль базы данных. |
| `database` | MySQL, PostgreSQL | - | Обязательный параметр. Имя исходной базы данных. Для PostgreSQL должно совпадать с именем базы данных в JDBC URL. |
| `schema` | PostgreSQL | - | Обязательный параметр. Имя схемы PostgreSQL. |
| `include_tables` | MySQL, PostgreSQL | - | Имена таблиц для синхронизации, разделённые запятыми. Если параметр не задан, синхронизируются все таблицы базы данных или схемы. |
| `exclude_tables` | MySQL, PostgreSQL | - | Имена таблиц, которые не нужно синхронизировать, разделённые запятыми. Этот параметр действует только в том случае, если `include_tables` не задан. |
| `table.<table_name>.target_table` | MySQL, PostgreSQL | Имя исходной таблицы | Задаёт имя целевой таблицы Doris для исходной таблицы. |
| `table.<table_name>.exclude_columns` | MySQL, PostgreSQL | - | Исключает неключевые столбцы исходной таблицы; имена столбцов разделяются запятыми. |
| `offset` | MySQL, PostgreSQL | `latest` | Начальное смещение. Поддерживаются `initial`, `snapshot`, `latest` и точные смещения в формате JSON. MySQL также поддерживает `earliest`. |
| `snapshot_split_size` | MySQL, PostgreSQL | `40960` (`8096` до 4.1.4) | Размер фрагмента полного снимка в строках. Должен быть положительным целым числом. |
| `snapshot_parallelism` | MySQL, PostgreSQL | `1` | Максимальное число фрагментов, которые Task планирует одновременно на этапе полной синхронизации. Должно быть положительным целым числом. |
| `ssl_mode` | MySQL, PostgreSQL | `disable` | Режим SSL. Допустимые значения: `disable`, `require` и `verify-ca`. |
| `ssl_rootcert` | MySQL, PostgreSQL | - | Файл сертификата CA в формате `FILE:<file_name>`. Обязателен при `ssl_mode=verify-ca`. |
| `server_id` | MySQL | Генерируется автоматически | Идентификатор сервера для компонента чтения MySQL CDC. Поддерживается отдельное значение, например `5400`, или диапазон с включёнными границами, например `5400-5408`. Ширина диапазона должна быть не меньше `snapshot_parallelism`. |
| `slot_name` | PostgreSQL | `doris_cdc_<job_id>` | Имя слота логической репликации. Пользовательский слот должен быть создан заранее; управлять им должен пользователь. |
| `publication_name` | PostgreSQL | `doris_pub_<job_id>` | Имя публикации. Пользовательская публикация должна быть создана заранее, включать все синхронизируемые таблицы и управляться пользователем. |

> Примечание о версиях: `table.<table_name>.target_table`, `table.<table_name>.exclude_columns`, `offset=snapshot`, `ssl_mode`, `ssl_rootcert`, `server_id`, `slot_name` и `publication_name` поддерживаются начиная с версии 4.1.0.

Если заданы и `include_tables`, и `exclude_tables`, приоритет имеет `include_tables`. Значения `slot_name` и `publication_name` могут содержать только строчные буквы, цифры и символы подчёркивания, не могут начинаться с цифры и ограничены 63 символами. Подробные сведения об особенностях каждого источника, форматах смещений JSON и настройке сертификатов SSL см. в разделах [MySQL CDC с автоматическим созданием таблиц](../../../data-operate/import/import-way/streaming-job/continuous-load-mysql-database.md) и [PostgreSQL CDC с автоматическим созданием таблиц](../../../data-operate/import/import-way/streaming-job/continuous-load-postgresql-database.md).

**5. `<target_db>`** (режим CDC для нескольких таблиц)
> Имя целевой базы данных Doris, в которую выполняется загрузка.

**6. `<target_property>`** (режим CDC для нескольких таблиц)

| Параметр | По умолчанию | Описание |
| --- | --- | --- |
| `table.create.properties.*` | - | Добавляет свойства таблицы при её создании в Doris, например `table.create.properties.replication_num`. |
| `load.strict_mode` | `false` | Определяет, включён ли строгий режим при записи через Stream Load. Допустимые значения: `true` и `false`. |
| `load.max_filter_ratio` | `0` | Максимально допустимая доля отфильтрованных строк в окне выборки, в диапазоне `[0, 1]`. Длительность окна выборки составляет `max_interval * 10` секунд. Задание приостанавливается, если доля строк с ошибками в этом окне превышает указанное значение. |

## Необязательные параметры {#optional-parameters}

**1. `<job_property>`**

| Параметр | По умолчанию | Описание |
| --- | --- | --- |
| `max_interval` | `10` | Интервал планирования в секундах при отсутствии новых файлов или данных в источнике. Должен быть целым числом, большим или равным 1. |
| `compute_group` | Вычислительная группа текущего сеанса или группа пользователя по умолчанию | Поддерживается только в режиме разделения вычислений и хранения. Задаёт вычислительную группу, в которой выполняется задание. Пользователь должен иметь привилегию USAGE для этой вычислительной группы. |
| `session.<variable_name>` | Значение соответствующей переменной сеанса по умолчанию | Поддерживается только в режиме TVF. Задаёт допустимую переменную сеанса Doris для задачи INSERT. |
| `s3.max_batch_files` | `256` | Запускает загрузку, когда количество накопленных файлов достигает этого значения. Используется только в S3 TVF. |
| `s3.max_batch_bytes` | `10737418240` | Запускает загрузку, когда объём накопленных данных достигает этого значения. Используется только в S3 TVF. Единица измерения: байты; допустимый диапазон: от 104857600 до 10737418240. |
| `offset` | - | Задаёт начальную позицию источника при создании S3 Streaming Job. Начальную позицию MySQL/PostgreSQL необходимо задавать в параметрах источника; сбросить позицию синхронизации CDC через `ALTER JOB` можно только с помощью точного смещения в формате JSON. |

Полный список параметров CDC Stream TVF, включая `type`, `table` и `include_delete_sign`, см. в разделе [CDC Stream](../../sql-functions/table-valued-functions/cdc-stream.md).

## Управление привилегиями {#privilege-control}

Для выполнения этой команды SQL пользователю необходимы как минимум следующие привилегии:

| Привилегия  | Объект      | Примечания                            |
|:------------|:------------|:--------------------------------------|
| LOAD_PRIV   | База данных | В настоящее время для этой операции поддерживается только привилегия **LOAD** |

## Примечания {#notes}

- TASK сохраняет только последние 100 записей.

### Использование PROPERTIES {#properties-usage}

Используйте `PROPERTIES` для настройки параметров выполнения Job, например для изменения интервала планирования или задания переменных сеанса:

```sql
CREATE JOB my_job
PROPERTIES (
    "max_interval" = "30",
    "session.insert_max_filter_ratio" = "0.5"
)
ON STREAMING
DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://bucket/s3/demo/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.endpoint" = "https://s3.ap-southeast-1.amazonaws.com",
    "s3.region" = "ap-southeast-1",
    "s3.access_key" = "",
    "s3.secret_key" = ""
);
```

## Примеры {#examples}

### Режим TVF {#tvf-mode-1}

- Создание задания, которое непрерывно отслеживает файлы в указанном каталоге S3 и загружает данные из файлов CSV в db1.tbl1.

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

- Создание задания, которое непрерывно синхронизирует одну таблицу MySQL с Doris с помощью CDC Stream TVF.

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

- Создание задания, которое непрерывно синхронизирует одну таблицу PostgreSQL с Doris с помощью CDC Stream TVF.

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

- Создание задания для синхронизации таблиц user_info и order_info из исходной базы данных MySQL в базу данных target_test_db с самого начала.

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

- Создание задания для непрерывной синхронизации инкрементальных данных из таблицы test_tbls исходной базы данных PostgreSQL в базу данных target_test_db.

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
| max_streaming_job_num                  | 1024    | Максимальное число заданий Streaming Job     |
| job_streaming_task_exec_thread_num     | 10      | Число потоков для StreamingTask              |
| max_streaming_task_show_count          | 100     | Максимальное число записей StreamingTask в памяти|
