---
{
    "title": "PostgreSQL",
    "language": "ru",
    "description": "Doris поддерживает несколько способов загрузки данных из PostgreSQL: разовую загрузку через JDBC Catalog, непрерывную полную и инкрементальную синхронизацию через Streaming Job и синхронизацию CDC через Flink Doris Connector."
}
---

Doris поддерживает следующие способы загрузки данных из PostgreSQL:

- **Загрузка данных из PostgreSQL через JDBC Catalog**

Doris подключает PostgreSQL как внешний Catalog с помощью JDBC Catalog, что позволяет выполнять SQL-запросы непосредственно к данным PostgreSQL. В сочетании с `INSERT INTO` или `CREATE TABLE AS SELECT` этот способ подходит для разовой миграции или периодической пакетной загрузки.

- **Непрерывная синхронизация данных из PostgreSQL через Streaming Job**

Doris использует Streaming Job для непрерывной полной и инкрементальной синхронизации данных из PostgreSQL в Doris. Благодаря встроенным возможностям чтения [Flink CDC](https://github.com/apache/flink-cdc) Doris поддерживает непрерывную работу задания, читает WAL из PostgreSQL и записывает данные в таблицы Doris с семантикой exactly-once. Поддерживаются два режима: SQL Mapping Sync и Auto Table Creation Sync. Доступно начиная с Doris 4.1.0.

- **Загрузка данных из PostgreSQL через Flink Doris Connector**

Используйте Flink Doris Connector вместе с Flink Postgres CDC для синхронизации в реальном времени. Этот способ подходит для сценариев, требующих дополнительной логики потоковой обработки во Flink. Коннектор также предоставляет инструмент для синхронизации всей базы данных одним нажатием. Подробнее см. в разделе [Flink Doris Connector](../../../connection-integration/data-integration/flink-doris-connector.md).

- **Загрузка данных из PostgreSQL через сторонние инструменты**

Инструменты интеграции данных, такие как [DataX](../../../connection-integration/data-integration/datax.md), [SeaTunnel](../../../connection-integration/data-integration/seatunnel.md) и [CloudCanal](../../../connection-integration/data-integration/cloudcanal.md), также поддерживают синхронизацию данных из PostgreSQL в Doris.

В большинстве случаев для разовой миграции данных можно напрямую использовать JDBC Catalog. Если требуется непрерывная полная и инкрементальная синхронизация, рекомендуется Streaming Job.

## Загрузка данных из PostgreSQL через JDBC Catalog {#loading-postgresql-data-via-jdbc-catalog}

Подключите PostgreSQL как внешний Catalog с помощью JDBC Catalog, затем используйте `INSERT INTO` или `CREATE TABLE AS SELECT` для загрузки данных. Подробное описание синтаксиса см. в разделе [JDBC PostgreSQL Catalog](../../../lakehouse/catalogs/jdbc-pg-catalog.md).

### Шаг 1: Подготовьте данные в PostgreSQL {#step-1-prepare-data-in-postgresql}

```sql
CREATE TABLE public.students (
    id    INT PRIMARY KEY,
    name  VARCHAR(64),
    age   INT
);

INSERT INTO public.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

### Шаг 2: Создайте Catalog в Doris {#step-2-create-a-catalog-in-doris}

```sql
CREATE CATALOG pg_catalog PROPERTIES (
    "type"         = "jdbc",
    "user"         = "postgres",
    "password"     = "postgres",
    "jdbc_url"     = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url"   = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver"
);
```

### Шаг 3: Создайте целевую таблицу в Doris {#step-3-create-the-target-table-in-doris}

```sql
CREATE DATABASE IF NOT EXISTS doris_db;

CREATE TABLE doris_db.students (
    id    INT,
    name  VARCHAR(64),
    age   INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

### Шаг 4: Загрузите данные с помощью INSERT INTO {#step-4-load-data-with-insert-into}

```sql
INSERT INTO doris_db.students
SELECT id, name, age FROM pg_catalog.postgres.public.students;
```

Если целевая таблица ещё не существует, можно также использовать `CREATE TABLE AS SELECT`, чтобы создать таблицу и загрузить данные за один шаг:

```sql
CREATE TABLE doris_db.students
PROPERTIES ("replication_num" = "1")
AS
SELECT * FROM pg_catalog.postgres.public.students;
```

### Шаг 5: Проверьте загруженные данные {#step-5-verify-loaded-data}

```sql
SELECT * FROM doris_db.students;
+----+-------+------+
| id | name  | age  |
+----+-------+------+
|  1 | Emily |   25 |
|  2 | Bob   |   30 |
+----+-------+------+
```

## Непрерывная синхронизация данных из PostgreSQL через Streaming Job {#continuously-syncing-postgresql-data-via-streaming-job}

Streaming Job непрерывно читает WAL PostgreSQL через Flink CDC и записывает изменения в Doris. Поддерживаются два режима:

- [PostgreSQL CDC с автоматическим созданием таблиц](../import-way/streaming-job/continuous-load-postgresql-database.md): Doris автоматически создаёт целевые таблицы при первой синхронизации (используйте `include_tables` для синхронизации одной, нескольких или всех таблиц). Обеспечивает семантику at-least-once.
- [PostgreSQL CDC с сопоставлением через SQL](../import-way/streaming-job/continuous-load-postgresql-table.md): целевая таблица должна быть заранее создана в Doris. Поддерживает гибкое сопоставление столбцов, преобразование данных и семантику exactly-once.

### Ограничения {#limitations}

1. Поддерживаются только таблицы с первичным ключом (Unique Key).
2. Требуются права Load. Для автоматического создания целевых таблиц при первом запуске в режиме Auto Table Creation Sync также требуются права Create.
3. Доступно начиная с Doris 4.1.0.

### Предварительные требования {#prerequisites}

Перед отправкой задания Streaming Job на стороне PostgreSQL необходимо включить логическую репликацию (`wal_level=logical`) и предоставить пользователю соответствующие права REPLICATION. Инструкции по настройке для конкретных сред см. в следующих разделах:

- [Руководство по настройке Amazon RDS PostgreSQL](../import-way/streaming-job/prerequisites/amazon-rds-postgresql.md)
- [Руководство по настройке Amazon Aurora PostgreSQL](../import-way/streaming-job/prerequisites/amazon-aurora-postgresql.md)
- Примечания и сведения о необходимых правах для каждого режима приведены в разделе [Обзор непрерывной загрузки](../import-way/streaming-job/continuous-load-overview.md).

### Пример использования: Auto Table Creation Sync {#operation-example-auto-table-creation-sync}

В режиме Auto Table Creation Sync используется синтаксис `FROM POSTGRES ... TO DATABASE ...`. Целевым объектом является база данных Doris, а таблицы в ней автоматически создаются при первой синхронизации.

#### Шаг 1: Подготовьте данные в PostgreSQL {#step-1-prepare-data-in-postgresql-1}

```sql
CREATE TABLE public.students (
    id    INT PRIMARY KEY,
    name  VARCHAR(64),
    age   INT
);

INSERT INTO public.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

#### Шаг 2: Создайте целевую базу данных в Doris {#step-2-create-the-target-database-in-doris}

Режим Auto Table Creation Sync **не требует предварительного создания таблиц**, но целевая база данных, в которой они будут размещены, должна существовать:

```sql
CREATE DATABASE IF NOT EXISTS doris_db;
```

#### Шаг 3: Создайте задание Streaming Job {#step-3-create-a-streaming-job}

В примере ниже параметр `include_tables` позволяет синхронизировать только таблицу `students` (несколько таблиц можно указать через запятую; для синхронизации всей базы данных оставьте значение пустым):

```sql
CREATE JOB pg_db_sync
ON STREAMING
FROM POSTGRES (
    "jdbc_url"       = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url"     = "postgresql-42.5.1.jar",
    "driver_class"   = "org.postgresql.Driver",
    "user"           = "postgres",
    "password"       = "postgres",
    "database"       = "postgres",
    "schema"         = "public",
    "include_tables" = "students",
    "offset"         = "initial"
)
TO DATABASE doris_db (
    "table.create.properties.replication_num" = "1"  -- set to 1 in single-BE deployments
);
```

#### Шаг 4: Проверьте состояние задания {#step-4-check-job-status}

```sql
SELECT * FROM jobs("type"="insert") WHERE ExecuteType = "STREAMING";
```

#### Шаг 5: Проверьте автоматически созданные таблицы Doris и загруженные данные {#step-5-inspect-auto-created-doris-tables-and-loaded-data}

```sql
SHOW TABLES FROM doris_db;
SELECT * FROM doris_db.students;
```

Описание других типовых операций и полный справочник параметров приведены в разделе [PostgreSQL CDC с автоматическим созданием таблиц](../import-way/streaming-job/continuous-load-postgresql-database.md).

### Пример использования: SQL Mapping Sync {#operation-example-sql-mapping-sync}

#### Шаг 1: Подготовьте данные в PostgreSQL {#step-1-prepare-data-in-postgresql-2}

```sql
CREATE TABLE public.students (
    id    INT PRIMARY KEY,
    name  VARCHAR(64),
    age   INT
);

INSERT INTO public.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

#### Шаг 2: Создайте целевую таблицу в Doris {#step-2-create-the-target-table-in-doris}

В режиме SQL Mapping Sync целевая таблица должна быть создана заранее:

```sql
CREATE DATABASE IF NOT EXISTS doris_db;

CREATE TABLE doris_db.students (
    id    INT,
    name  VARCHAR(64),
    age   INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

#### Шаг 3: Создайте задание Streaming Job {#step-3-create-a-streaming-job-1}

Используйте [CREATE STREAMING JOB](../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) с синтаксисом `INSERT INTO ... SELECT * FROM cdc_stream(...)`:

```sql
CREATE JOB pg_students_sync
ON STREAMING
DO
INSERT INTO doris_db.students
SELECT * FROM cdc_stream(
    "type"         = "postgres",
    "jdbc_url"     = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url"   = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver",
    "user"         = "postgres",
    "password"     = "postgres",
    "database"     = "postgres",
    "schema"       = "public",
    "table"        = "students",
    "offset"       = "initial"
);
```

#### Шаг 4: Проверьте состояние задания {#step-4-check-job-status-1}

```sql
SELECT * FROM jobs("type"="insert") WHERE ExecuteType = "STREAMING";
```

#### Шаг 5: Проверьте загруженные данные {#step-5-verify-loaded-data-1}

```sql
SELECT * FROM doris_db.students;
```

Описание других типовых операций (приостановка, возобновление, удаление, проверка состояния задачи и т. д.) и полный справочник параметров приведены в разделе [PostgreSQL CDC с сопоставлением через SQL](../import-way/streaming-job/continuous-load-postgresql-table.md).
