---
{
    "title": "CDC_STREAM | Табличные функции",
    "language": "ru",
    "description": "Используйте CDC Stream TVF для чтения изменений из MySQL и PostgreSQL при выполнении инкрементальных запросов или полной и инкрементальной синхронизации с помощью Streaming Job.",
    "sidebar_label": "CDC_STREAM"
}
---

# CDC_STREAM {#cdc_stream}

## Описание {#description}

Табличная функция CDC Stream (TVF) считывает данные об изменениях из реляционных баз данных, таких как MySQL и PostgreSQL, с помощью CDC. Благодаря интеграции возможностей чтения [Flink CDC](https://github.com/apache/flink-cdc) функция непрерывно считывает журналы изменений базы данных (Binlog/WAL) и передаёт результаты оператору INSERT задания Streaming Job для записи в Doris.

> Эта функция поддерживается начиная с версии 4.1.0.

Обычно она используется совместно с `CREATE JOB ON STREAMING` для непрерывной полной и инкрементальной синхронизации одной таблицы с сопоставлением с помощью SQL. Подробности см. в разделах [MySQL CDC: сопоставление с помощью SQL](../../../data-operate/import/import-way/streaming-job/continuous-load-mysql-table.md) и [PostgreSQL CDC: сопоставление с помощью SQL](../../../data-operate/import/import-way/streaming-job/continuous-load-postgresql-table.md).

:::note
При самостоятельном использовании CDC Stream TVF поддерживает только инкрементальную синхронизацию данных и не поддерживает чтение полного снимка. При использовании совместно с [CREATE STREAMING JOB](../../sql-statements/job/CREATE-STREAMING-JOB.md) функция поддерживает полную и инкрементальную синхронизацию.
:::

## Примечания по использованию {#usage-notes}

1. При самостоятельном использовании CDC Stream TVF поддерживает только инкрементальную синхронизацию; при использовании совместно с `CREATE JOB ON STREAMING` поддерживает полную и инкрементальную синхронизацию.
2. Обычно функция используется совместно с `CREATE JOB ON STREAMING`; использовать её в обычных запросах не рекомендуется.
3. Если для `skip_snapshot_backfill` задано значение `true`, применяется семантика at-least-once.
4. При использовании MySQL необходимо включить Binlog (`binlog_format=ROW`). Если диапазон `server_id` задан явно, количество идентификаторов в нём должно быть не меньше `snapshot_parallelism`.
5. При использовании PostgreSQL необходимо включить логическую репликацию (`wal_level=logical`). Указанные пользователем слоты репликации и публикации необходимо создать заранее; за их очистку также отвечает пользователь.
6. При `ssl_mode=verify-ca` необходимо также задать `ssl_rootcert`.
7. При `include_delete_sign=true` целевая таблица должна быть таблицей Unique Key с Merge-on-Write, а `__DORIS_DELETE_SIGN__` необходимо явно сопоставить как в списке целевых столбцов INSERT, так и в списке SELECT.

## Синтаксис {#syntax}

```sql
cdc_stream(
    "type" = "<source_type>",
    "jdbc_url" = "<jdbc_url>",
    "driver_url" = "<driver_url>",
    "driver_class" = "<driver_class>",
    "user" = "<user>",
    "password" = "<password>",
    "table" = "<table>",
    "offset" = "<offset>"
    [, "database" = "<database>"]
    [, "schema" = "<schema>"]
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
)
```

## Параметры {#parameters}

| Параметр | Применимые источники | Обязателен | По умолчанию | Описание |
| --- | --- | --- | --- | --- |
| `type` | MySQL, PostgreSQL | Да | - | Тип источника данных. Задайте `mysql` для MySQL или `postgres` для PostgreSQL. |
| `jdbc_url` | MySQL, PostgreSQL | Да | - | Строка подключения JDBC, например `jdbc:mysql://127.0.0.1:3306` или `jdbc:postgresql://127.0.0.1:5432/postgres`. |
| `driver_url` | MySQL, PostgreSQL | Да | - | Путь к JAR-файлу драйвера JDBC. Поддерживается имя файла, локальный абсолютный путь или HTTP URL. |
| `driver_class` | MySQL, PostgreSQL | Да | - | Имя класса драйвера JDBC. Используйте `com.mysql.cj.jdbc.Driver` для MySQL или `org.postgresql.Driver` для PostgreSQL. |
| `user` | MySQL, PostgreSQL | Да | - | Имя пользователя базы данных. |
| `password` | MySQL, PostgreSQL | Да | - | Пароль базы данных. |
| `database` | MySQL, PostgreSQL | Обязателен для MySQL | Имя базы данных в JDBC URL PostgreSQL | Имя базы данных. Для PostgreSQL явно заданное значение переопределяет имя базы данных в JDBC URL и не может превышать 63 байт после кодирования в UTF-8. |
| `schema` | PostgreSQL | Да | - | Имя схемы PostgreSQL. |
| `table` | MySQL, PostgreSQL | Да | - | Имя таблицы для синхронизации. Каждая CDC Stream TVF поддерживает одну исходную таблицу. |
| `offset` | MySQL, PostgreSQL | Да | - | Начальное смещение. `initial`: полная и инкрементальная синхронизация; `snapshot`: только полная синхронизация; `latest`: синхронизация только изменений после запуска. MySQL также поддерживает `earliest`. Примеры точного задания смещения в JSON: для MySQL используется `{"file":"binlog.000001","pos":"154"}` или `{"gtids":"<gtid_set>"}`, а для PostgreSQL используется `{"lsn":"12345678"}`. |
| `snapshot_split_size` | MySQL, PostgreSQL | Нет | `40960` | Размер фрагмента в строках. При полной синхронизации таблица делится на несколько фрагментов. Должен быть положительным целым числом. Значение по умолчанию было `8096` до версии 4.1.4. |
| `snapshot_parallelism` | MySQL, PostgreSQL | Нет | `1` | Параллелизм этапа полной синхронизации, то есть максимальное количество фрагментов, которые Task может запланировать одновременно. Должен быть положительным целым числом. |
| `skip_snapshot_backfill` | MySQL, PostgreSQL | Нет | `false` | Определяет, нужно ли пропускать инкрементальную дозагрузку при создании снимка. При значении `true` применяется семантика at-least-once. |
| `ssl_mode` | MySQL, PostgreSQL | Нет | `disable` | Режим SSL. Допустимые значения: `disable`, `require` и `verify-ca`. |
| `ssl_rootcert` | MySQL, PostgreSQL | Обязателен при определённых условиях | - | Файл сертификата CA в формате `FILE:<file_name>`. Обязателен, если для `ssl_mode` задано значение `verify-ca`. Сначала загрузите файл с помощью [CREATE FILE](../../sql-statements/security/CREATE-FILE.md). |
| `server_id` | MySQL | Нет | Генерируется автоматически | Идентификатор сервера считывателя MySQL CDC. Поддерживается одно значение, например `5400`, или замкнутый диапазон, например `5400-5408`. Размер диапазона должен быть больше или равен `snapshot_parallelism`. |
| `slot_name` | PostgreSQL | Нет | `doris_cdc_<job_id>` | Имя слота логической репликации. Имя может содержать только строчные буквы, цифры и символы подчёркивания, не может начинаться с цифры и ограничено 63 символами. Пользовательский слот необходимо создать заранее; Doris его не удаляет. |
| `publication_name` | PostgreSQL | Нет | `doris_pub_<job_id>` | Имя публикации. Правила именования те же, что и для `slot_name`. Пользовательскую публикацию необходимо создать заранее, она должна включать исходную таблицу и не удаляется Doris. |
| `include_delete_sign` | MySQL, PostgreSQL | Нет | `false` | Определяет, выводить ли дополнительный столбец `__DORIS_DELETE_SIGN__`. Задайте `true`, чтобы синхронизировать операции DELETE в источнике как удаления в таблице Doris с первичным ключом. |

## Возвращаемое значение {#return-value}

Возвращает столбцы исходной таблицы. Имена и типы столбцов определяются по схеме исходной таблицы, а значения NULL из источника возвращаются с использованием соответствующих типов столбцов. При `include_delete_sign=true` результат включает дополнительный столбец `TINYINT` с именем `__DORIS_DELETE_SIGN__`; у обычных записей значение равно `0`, а у записей об удалении равно `1`. Если источник данных недоступен, исходная таблица не найдена или параметр некорректен, анализ либо выполнение функции завершается ошибкой, и данные не возвращаются.

Начиная с версии 4.1.5, при использовании со Streaming Job операции CDC проверяют права доступа в Doris от имени создателя задания, а для завершившихся ошибкой задач не используется обычный механизм автоматического повторного выполнения. См. раздел [Идентификация при непрерывной загрузке и обработка сбоев](../../../data-operate/import/import-way/streaming-job/continuous-load-overview.md#cdc-task-identity-and-failure-handling).

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
  );
  ```

  ```text
  The Job is created successfully; the source table's initial data and subsequent Binlog changes are continuously written to db1.target_table.
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
  );
  ```

  ```text
  The Job is created successfully; the source table's initial data and subsequent WAL changes are continuously written to db1.target_table.
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
  );
  ```

  ```text
  The Job is created successfully; after age is converted to INT, the selected columns are continuously written to db1.target_table.
  ```

- Синхронизация операций DELETE из источника

  ```sql
  CREATE JOB mysql_cdc_delete_job
  ON STREAMING
  DO
  INSERT INTO db1.target_table (id, name, __DORIS_DELETE_SIGN__)
  SELECT id, name, __DORIS_DELETE_SIGN__
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

  ```text
  The Job is created successfully; regular records carry delete sign 0, and DELETE records carry delete sign 1.
  ```
