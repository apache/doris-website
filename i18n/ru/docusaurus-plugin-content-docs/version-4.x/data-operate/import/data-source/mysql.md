---
{
    "title": "MySQL",
    "language": "ru",
    "description": "Doris предоставляет несколько способов загрузки данных из MySQL, включая разовую загрузку через JDBC Catalog, непрерывную полную и инкрементальную синхронизацию через Streaming Job и синхронизацию CDC через Flink Doris Connector."
}
---

Doris предоставляет следующие способы загрузки данных из MySQL:

- **Загрузка данных MySQL через JDBC Catalog**

Doris использует JDBC Catalog для подключения MySQL в качестве внешнего Catalog, что позволяет выполнять SQL-запросы непосредственно к данным MySQL. В сочетании с `INSERT INTO` или `CREATE TABLE AS SELECT` этот способ подходит для разовой миграции или периодической пакетной загрузки.

- **Непрерывная синхронизация данных MySQL через Streaming Job**

Doris использует Streaming Job для непрерывной полной и инкрементальной синхронизации данных из MySQL в Doris. Благодаря встроенным возможностям чтения [Flink CDC](https://github.com/apache/flink-cdc) Doris поддерживает непрерывную работу задания, считывает Binlog из MySQL и записывает данные в таблицы Doris с семантикой exactly-once. Поддерживаются два режима: SQL Mapping Sync и Auto Table Creation Sync. Доступно начиная с Doris 4.1.0.

- **Загрузка данных MySQL через Flink Doris Connector**

Используйте Flink Doris Connector совместно с Flink MySQL CDC для синхронизации в реальном времени. Этот способ подходит для сценариев, требующих дополнительной логики потоковой обработки во Flink. Коннектор также предоставляет инструмент синхронизации всей базы данных одним нажатием. Подробнее см. в разделе [Flink Doris Connector](../../../connection-integration/data-integration/flink-doris-connector.md).

- **Загрузка данных MySQL через сторонние инструменты**

Инструменты интеграции данных, такие как [DataX](../../../connection-integration/data-integration/datax.md), [SeaTunnel](../../../connection-integration/data-integration/seatunnel.md) и [CloudCanal](../../../connection-integration/data-integration/cloudcanal.md), также поддерживают синхронизацию данных из MySQL в Doris.

В большинстве случаев для разовой миграции данных можно использовать JDBC Catalog напрямую. Если требуется непрерывная полная и инкрементальная синхронизация, рекомендуется Streaming Job.

## Загрузка данных MySQL через JDBC Catalog {#loading-mysql-data-via-jdbc-catalog}

Подключите MySQL в качестве внешнего Catalog с помощью JDBC Catalog, а затем используйте `INSERT INTO` или `CREATE TABLE AS SELECT` для загрузки данных. Подробное описание синтаксиса см. в разделе [JDBC MySQL Catalog](../../../lakehouse/catalogs/jdbc-mysql-catalog.md).

### Шаг 1: подготовка данных в MySQL {#step-1-prepare-data-in-mysql}

```sql
CREATE TABLE test.students (
    id     INT PRIMARY KEY,
    name   VARCHAR(64),
    age    INT
);

INSERT INTO test.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

### Шаг 2: создание Catalog в Doris {#step-2-create-a-catalog-in-doris}

```sql
CREATE CATALOG mysql_catalog PROPERTIES (
    "type"         = "jdbc",
    "user"         = "root",
    "password"     = "123456",
    "jdbc_url"     = "jdbc:mysql://127.0.0.1:3306/test",
    "driver_url"   = "mysql-connector-java-8.0.25.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver"
);
```

### Шаг 3: создание целевой таблицы в Doris {#step-3-create-the-target-table-in-doris}

```sql
CREATE DATABASE IF NOT EXISTS doris_db;

CREATE TABLE doris_db.students (
    id     INT,
    name   VARCHAR(64),
    age    INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

### Шаг 4: загрузка данных с помощью INSERT INTO {#step-4-load-data-with-insert-into}

```sql
INSERT INTO doris_db.students
SELECT id, name, age FROM mysql_catalog.test.students;
```

Если целевая таблица ещё не существует, можно также использовать `CREATE TABLE AS SELECT`, чтобы создать таблицу и загрузить данные за один шаг:

```sql
CREATE TABLE doris_db.students
PROPERTIES ("replication_num" = "1")
AS
SELECT * FROM mysql_catalog.test.students;
```

### Шаг 5: проверка загруженных данных {#step-5-verify-loaded-data}

```sql
SELECT * FROM doris_db.students;
+----+-------+------+
| id | name  | age  |
+----+-------+------+
|  1 | Emily |   25 |
|  2 | Bob   |   30 |
+----+-------+------+
```

## Непрерывная синхронизация данных MySQL через Streaming Job {#continuously-syncing-mysql-data-via-streaming-job}

Streaming Job непрерывно считывает Binlog MySQL через Flink CDC и записывает данные в Doris. Поддерживаются два режима:

- [MySQL CDC с автоматическим созданием таблиц](../import-way/streaming-job/continuous-load-mysql-database.md): Doris автоматически создаёт целевые таблицы при первой синхронизации (используйте `include_tables` для синхронизации одной, нескольких или всех таблиц). Обеспечивает семантику at-least-once.
- [MySQL CDC с сопоставлением SQL](../import-way/streaming-job/continuous-load-mysql-table.md): целевая таблица должна быть заранее создана в Doris. Поддерживает гибкое сопоставление столбцов, преобразование данных и семантику exactly-once.

### Ограничения {#limitations}

1. Поддерживаются только таблицы с первичным ключом (Unique Key).
2. Требуется привилегия Load. Для режима Auto Table Creation Sync также требуется привилегия Create, если целевые таблицы создаются автоматически при первом запуске.
3. Доступно начиная с Doris 4.1.0.

### Предварительные требования {#prerequisites}

Перед отправкой Streaming Job необходимо включить Binlog на стороне MySQL и предоставить пользователю соответствующие привилегии REPLICATION. Инструкции по настройке для конкретных сред см. в следующих разделах:

- [Руководство по настройке Amazon RDS MySQL](../import-way/streaming-job/prerequisites/amazon-rds-mysql.md)
- [Руководство по настройке Amazon Aurora MySQL](../import-way/streaming-job/prerequisites/amazon-aurora-mysql.md)
- Примечания и необходимые разрешения для каждого режима см. в разделе [Обзор непрерывной загрузки](../import-way/streaming-job/continuous-load-overview.md).

### Пример использования: Auto Table Creation Sync {#operation-example-auto-table-creation-sync}

Режим Auto Table Creation Sync использует синтаксис `FROM MYSQL ... TO DATABASE ...`. В качестве назначения указывается база данных Doris, а целевые таблицы автоматически создаются при первой синхронизации.

#### Шаг 1: подготовка данных в MySQL {#step-1-prepare-data-in-mysql-1}

```sql
CREATE TABLE test.students (
    id     INT PRIMARY KEY,
    name   VARCHAR(64),
    age    INT
);

INSERT INTO test.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

#### Шаг 2: создание целевой базы данных в Doris {#step-2-create-the-target-database-in-doris}

Режим Auto Table Creation Sync **не требует предварительного создания таблиц**, но целевая база данных, в которой они будут размещены, должна существовать:

```sql
CREATE DATABASE IF NOT EXISTS doris_db;
```

#### Шаг 3: создание Streaming Job {#step-3-create-a-streaming-job}

В приведённом ниже примере используется `include_tables` для синхронизации только таблицы `students` (несколько таблиц можно перечислить через запятую; оставьте значение пустым для синхронизации всей базы данных):

```sql
CREATE JOB mysql_db_sync
ON STREAMING
FROM MYSQL (
    "jdbc_url"       = "jdbc:mysql://127.0.0.1:3306",
    "driver_url"     = "mysql-connector-java-8.0.25.jar",
    "driver_class"   = "com.mysql.cj.jdbc.Driver",
    "user"           = "root",
    "password"       = "123456",
    "database"       = "test",
    "include_tables" = "students",
    "offset"         = "initial"
)
TO DATABASE doris_db (
    "table.create.properties.replication_num" = "1"  -- set to 1 in single-BE deployments
);
```

#### Шаг 4: проверка состояния задания {#step-4-check-job-status}

```sql
SELECT * FROM jobs("type"="insert") WHERE ExecuteType = "STREAMING";
```

#### Шаг 5: просмотр автоматически созданных таблиц Doris и загруженных данных {#step-5-inspect-auto-created-doris-tables-and-loaded-data}

```sql
SHOW TABLES FROM doris_db;
SELECT * FROM doris_db.students;
```

Другие распространённые операции и полный справочник параметров см. в разделе [MySQL CDC с автоматическим созданием таблиц](../import-way/streaming-job/continuous-load-mysql-database.md).

### Пример использования: SQL Mapping Sync {#operation-example-sql-mapping-sync}

#### Шаг 1: подготовка данных в MySQL {#step-1-prepare-data-in-mysql-2}

```sql
CREATE TABLE test.students (
    id     INT PRIMARY KEY,
    name   VARCHAR(64),
    age    INT
);

INSERT INTO test.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

#### Шаг 2: создание целевой таблицы в Doris {#step-2-create-the-target-table-in-doris}

Для режима SQL Mapping Sync целевая таблица должна быть создана заранее:

```sql
CREATE DATABASE IF NOT EXISTS doris_db;

CREATE TABLE doris_db.students (
    id     INT,
    name   VARCHAR(64),
    age    INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

#### Шаг 3: создание Streaming Job {#step-3-create-a-streaming-job-1}

Используйте [CREATE STREAMING JOB](../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) с синтаксисом `INSERT INTO ... SELECT * FROM cdc_stream(...)`:

```sql
CREATE JOB mysql_students_sync
ON STREAMING
DO
INSERT INTO doris_db.students
SELECT * FROM cdc_stream(
    "type"         = "mysql",
    "jdbc_url"     = "jdbc:mysql://127.0.0.1:3306",
    "driver_url"   = "mysql-connector-java-8.0.25.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver",
    "user"         = "root",
    "password"     = "123456",
    "database"     = "test",
    "table"        = "students",
    "offset"       = "initial"
);
```

#### Шаг 4: проверка состояния задания {#step-4-check-job-status-1}

```sql
SELECT * FROM jobs("type"="insert") WHERE ExecuteType = "STREAMING";
```

#### Шаг 5: проверка загруженных данных {#step-5-verify-loaded-data-1}

```sql
SELECT * FROM doris_db.students;
```

Другие распространённые операции (приостановка, возобновление, удаление, проверка задачи и т. д.) и полный справочник параметров см. в разделе [MySQL CDC с сопоставлением SQL](../import-way/streaming-job/continuous-load-mysql-table.md).
