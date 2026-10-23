---
{
    "title": "REFRESH",
    "language": "ru",
    "description": "Эта инструкция обновляет метаданные указанного Catalog, базы данных или таблицы."
}
---

## Описание {#description}

Эта инструкция обновляет метаданные указанного Catalog, базы данных или таблицы.

## Синтаксис {#syntax}

```sql
REFRESH CATALOG <catalog_name>
    [PROPERTIES ("invalid_cache" = "true" | "false")];
REFRESH DATABASE [<catalog_name>.]<database_name>;
REFRESH TABLE [[<catalog_name>.]<database_name>.]<table_name>;
```

## Обязательные параметры {#required-parameters}

**1. `<catalog_name>`**

Имя Catalog, метаданные которого необходимо обновить.

**2. `[<catalog_name>.]<database_name>`**

Имя базы данных в Catalog, метаданные которой необходимо обновить.

**3. `[[<catalog_name>.]<database_name>.]<table_name>`**

Имя таблицы в Catalog, метаданные которой необходимо обновить.

## Требования к правам доступа {#access-control-requirements}
| Привилегия                                                                                   | Объект  | Примечания                                |
|:---------------------------------------------------------------------------------------------|:--------|:------------------------------------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | Catalog | Требуется одно из перечисленных прав доступа. |


## Примечания по использованию {#usage-notes}
При обновлении Catalog принудительно аннулируется кеш, связанный с объектами, включая Partition Cache, Schema Cache, File Cache и другие кеши.

`invalid_cache` определяет, будут ли при выполнении `REFRESH CATALOG` аннулированы кеши метаданных нижних уровней:

- `true`: аннулировать кеши объектов Catalog и кеши нижних уровней, такие как кеши разделов, схем и файлов. Это поведение по умолчанию.
- `false`: обновить только метаданные объектов и имён на уровне Catalog, сохранив кеши нижних уровней.

`invalid_cache` в настоящее время применяется к `REFRESH CATALOG`.

## Пример {#example}

1. Обновить Catalog hive

    ```sql
    REFRESH CATALOG hive;
    ```

2. Обновить Catalog hive без аннулирования кешей нижних уровней

    ```sql
    REFRESH CATALOG hive PROPERTIES("invalid_cache" = "false");
    ```

3. Обновить базу данных database1

    ```sql
    REFRESH DATABASE ctl.database1;
    REFRESH DATABASE database1;
    ```

4. Обновить таблицу table1

    ```sql
    REFRESH TABLE ctl.db.table1;
    REFRESH TABLE db.table1;
    REFRESH TABLE table1;
    ```
