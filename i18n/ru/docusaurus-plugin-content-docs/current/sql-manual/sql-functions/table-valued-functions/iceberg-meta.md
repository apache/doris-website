---
{
    "title": "ICEBERG_META",
    "language": "ru",
    "description": "Табличная функция iceberg_meta (tvf) для чтения различных метаданных таблицы Iceberg. Эта табличная функция удалена в версии 4.1.4; вместо неё используйте системные таблицы Iceberg."
}
---

:::caution Изменение поведения (4.1.4)

Табличная функция `iceberg_meta()` удалена в версии **4.1.4**. При её вызове выводится ошибка:

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Could not find table function iceberg_meta
```

Для получения тех же метаданных используйте системные таблицы Iceberg. Системные таблицы поддерживаются с версии 3.1.0, охватывают все значения `query_type` функции `iceberg_meta()` и предоставляют доступ к дополнительным типам метаданных. См. [Системные таблицы Iceberg Catalog](../../../lakehouse/catalogs/iceberg-catalog.mdx#system-tables).

В версиях до 4.1.4 по-прежнему можно использовать `iceberg_meta()`, поэтому описание её использования сохранено в этом документе для справки.

:::

## Описание {#description}

Табличная функция iceberg_meta (tvf) используется для чтения метаданных Iceberg: истории операций, снимков таблицы, метаданных файлов и т. д.

## Замена: системные таблицы Iceberg {#replacement-iceberg-system-tables}

Для доступа к системной таблице к имени таблицы добавляют `$` и имя системной таблицы:

```sql
SELECT * FROM <catalog>.<database>.<table>$<system_table_name>;
```

Каждому значению `query_type` функции `iceberg_meta()` соответствует системная таблица:

| `query_type` функции `iceberg_meta()` | Соответствующая системная таблица   |
|----------------------------------|---------------------------|
| `snapshots`                      | `<table>$snapshots`       |
| `manifests`                      | `<table>$manifests`       |
| `all_manifests`                  | `<table>$all_manifests`   |
| `files`                          | `<table>$files`           |
| `data_files`                     | `<table>$data_files`      |
| `delete_files`                   | `<table>$delete_files`    |
| `partitions`                     | `<table>$partitions`      |
| `refs`                           | `<table>$refs`            |
| `history`                        | `<table>$history`         |
| `metadata_log_entries`           | `<table>$metadata_log_entries` |

Примеры замены запросов:

```sql
-- Before 4.1.4
SELECT * FROM iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots");

-- 4.1.4 and later
SELECT * FROM iceberg_ctl.test_db.test_tbl$snapshots;
```

```sql
-- Before 4.1.4: filtered by the snapshot_id column
SELECT * FROM iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots")
WHERE snapshot_id = 98865735822;

-- 4.1.4 and later
SELECT * FROM iceberg_ctl.test_db.test_tbl$snapshots WHERE snapshot_id = 98865735822;
```

## Синтаксис (до версии 4.1.4) {#syntax-before-414}

```sql
ICEBERG_META(
    "table" = "<table>", 
    "query_type" = "<query_type>"
  );
```

## Обязательные параметры (до версии 4.1.4) {#required-parameters-before-414}

Каждый параметр табличной функции `iceberg_meta` (tvf) представляет собой пару `"key"="value"`.

| Поле           | Описание                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<table>`      | Полное имя таблицы Iceberg, которую требуется просмотреть; указывается в формате `database_name.table_name`.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `<query_type>` | Тип метаданных, которые требуется просмотреть. Поддерживаемые типы:<br/>`snapshots`: информация о снимках<br/>`manifests`: файлы манифестов текущего снимка<br/>`all_manifests`: файлы манифестов всех действительных снимков (поддерживается с версии 4.0.4)<br/>`files`: информация о файлах текущего снимка<br/>`data_files`: файлы данных текущего снимка<br/>`delete_files`: файлы удалений текущего снимка<br/>`partitions`: информация о разделах<br/>`refs`: информация о ссылках (ветки и теги)<br/>`history`: записи истории<br/>`metadata_log_entries`: записи журнала метаданных |

## Примеры {#examples}

- Чтение и просмотр метаданных снимков таблицы Iceberg.

    ```sql
    select * from iceberg_ctl.db.tbl$snapshots;
    ```

- Просмотр снимков таблицы Iceberg:

    ```sql
    select * from iceberg_ctl.test_db.test_tbl$snapshots;
    ```
    ```text
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |      committed_at      |  snapshot_id   |   parent_id   | operation |   manifest_list   |            summary           |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |  2022-09-20 11:14:29   |  64123452344   |       -1      |  append   | hdfs:/path/to/m1  | {"flink.job-id":"xxm1", ...} |
    |  2022-09-21 10:36:35   |  98865735822   |  64123452344  | overwrite | hdfs:/path/to/m2  | {"flink.job-id":"xxm2", ...} |
    |  2022-09-21 21:44:11   |  51232845315   |  98865735822  | overwrite | hdfs:/path/to/m3  | {"flink.job-id":"xxm3", ...} |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    ```

- Фильтрация по snapshot_id:

    ```sql
    select * from iceberg_ctl.test_db.test_tbl$snapshots where snapshot_id = 98865735822;
    ```
    ```text
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |      committed_at      |  snapshot_id   |   parent_id   | operation |   manifest_list   |            summary           |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |  2022-09-21 10:36:35   |  98865735822   |  64123452344  | overwrite | hdfs:/path/to/m2  | {"flink.job-id":"xxm2", ...} |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    ```

- Просмотр других метаданных таблицы Iceberg

    ```sql
    select * from iceberg_ctl.test_db.test_tbl$manifests;
    select * from iceberg_ctl.test_db.test_tbl$all_manifests;
    select * from iceberg_ctl.test_db.test_tbl$files;
    select * from iceberg_ctl.test_db.test_tbl$data_files;
    select * from iceberg_ctl.test_db.test_tbl$delete_files;
    select * from iceberg_ctl.test_db.test_tbl$partitions;
    select * from iceberg_ctl.test_db.test_tbl$refs;
    select * from iceberg_ctl.test_db.test_tbl$history;
    select * from iceberg_ctl.test_db.test_tbl$metadata_log_entries;
    ```

## См. также {#related}

Подробные сведения о системных таблицах Iceberg см. в разделе [Системные таблицы Iceberg Catalog](../../../lakehouse/catalogs/iceberg-catalog.mdx#system-tables).
