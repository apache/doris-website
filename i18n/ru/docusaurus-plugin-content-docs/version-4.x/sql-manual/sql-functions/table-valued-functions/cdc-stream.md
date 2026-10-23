---
{
    "title": "CDC_STREAM | Табличные функции",
    "language": "ru",
    "description": "Табличная функция (TVF) CDC Stream позволяет читать изменения данных из реляционных баз данных (таких как MySQL и PostgreSQL) через CDC и поддерживает полную и инкрементальную синхронизацию.",
    "sidebar_label": "CDC_STREAM"
}
---

# CDC_STREAM {#cdc_stream}

## Описание {#description}

Табличная функция (TVF) CDC Stream позволяет читать изменения данных из реляционных баз данных (таких как MySQL и PostgreSQL) через CDC. Благодаря интеграции возможностей чтения [Flink CDC](https://github.com/apache/flink-cdc) она поддерживает полную и инкрементальную синхронизацию данных.

Обычно она используется с `CREATE JOB ON STREAMING` для непрерывной синхронизации данных одной таблицы с сопоставлением с помощью SQL. Подробности см. в разделах [CDC из MySQL с сопоставлением с помощью SQL](../../../data-operate/import/import-way/streaming-job/continuous-load-mysql-table.md) и [CDC из PostgreSQL с сопоставлением с помощью SQL](../../../data-operate/import/import-way/streaming-job/continuous-load-postgresql-table.md).

## Синтаксис {#syntax}

```sql
cdc_stream(
    "type" = "<source_type>",
    "jdbc_url" = "<jdbc_url>",
    "driver_url" = "<driver_url>",
    "driver_class" = "<driver_class>",
    "user" = "<user>",
    "password" = "<password>",
    "database" = "<database>",
    "table" = "<table>"
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
)
```

## Обязательные параметры {#required-parameters}

| Параметр       | Описание                                                     |
|----------------|--------------------------------------------------------------|
| `type`         | Тип источника данных; в настоящее время поддерживаются `mysql` и `postgres` |
| `jdbc_url`     | Строка подключения JDBC, например `jdbc:mysql://127.0.0.1:3306` или `jdbc:postgresql://127.0.0.1:5432/postgres` |
| `driver_url`   | Путь к jar-файлу драйвера JDBC                                |
| `driver_class` | Имя класса драйвера JDBC. `com.mysql.cj.jdbc.Driver` для MySQL, `org.postgresql.Driver` для PostgreSQL |
| `user`         | Имя пользователя базы данных                                 |
| `password`     | Пароль базы данных                                           |
| `database`     | Имя базы данных                                              |
| `table`        | Имя таблицы для синхронизации                                 |

## Необязательные параметры {#optional-parameters}

| Параметр               | По умолчанию | Описание                                                     |
|------------------------|---------|--------------------------------------------------------------|
| `schema`               | -       | Имя схемы; обязательно для PostgreSQL                         |
| `offset`               | latest  | `latest`: только инкрементальная синхронизация; `initial`: полная + инкрементальная синхронизация; также поддерживаются `snapshot`, `earliest` (только для MySQL) или позиция binlog/LSN в формате JSON |
| `snapshot_split_size`  | 40960 (8096 до 4.1.4)    | Размер фрагмента (в строках). При полной синхронизации таблица разбивается на несколько фрагментов |
| `snapshot_parallelism` | 1       | Степень параллелизма на этапе полной синхронизации, то есть максимальное число фрагментов на задачу |

## Примечания {#notes}

1. CDC Stream TVF обычно используется с `CREATE JOB ON STREAMING` и не рекомендуется для обычных запросов.
2. При использовании источника типа MySQL необходимо включить Binlog в MySQL (`binlog_format=ROW`).
3. При использовании источника типа PostgreSQL необходимо включить логическую репликацию (`wal_level=logical`).
4. Поддерживается семантика exactly-once.

Начиная с 4.1.5, при использовании со Streaming Job операции CDC проверяют права доступа в Doris от имени создателя задания, а для задач, завершившихся с ошибкой, не применяется обычный механизм автоматического повторного запуска. См. раздел [Учетная запись и обработка сбоев при непрерывной загрузке](../../../data-operate/import/import-way/streaming-job/continuous-load-overview.md#cdc-task-identity-and-failure-handling).

## Примеры {#examples}

- Непрерывная синхронизация одной таблицы из MySQL

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
  )
  ```

- Непрерывная синхронизация одной таблицы из PostgreSQL

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
  )
  ```

- Только инкрементальная синхронизация (без полного снимка)

  ```sql
  CREATE JOB mysql_incremental_job
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
      "offset" = "latest"
  )
  ```

- Сопоставление столбцов и преобразование данных

  ```sql
  CREATE JOB mysql_cdc_transform_job
  ON STREAMING
  DO
  INSERT INTO db1.target_table (id, name, age)
  SELECT id, name, cast(age as INT) as age
  FROM cdc_stream(
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
