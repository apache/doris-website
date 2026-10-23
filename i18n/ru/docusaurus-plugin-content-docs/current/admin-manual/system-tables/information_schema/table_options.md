---
{
    "title": "table_options",
    "language": "ru",
    "description": "Эта таблица используется исключительно для совместимости с поведением MySQL. Она всегда пуста."
}
---

## Обзор {#overview}

Эта таблица используется исключительно для совместимости с поведением MySQL. Она всегда пуста.

## База данных {#database}


`information_schema`


## Сведения о таблице {#table-information}

| Имя столбца     | Тип         | Описание    |
| --------------- | ----------- | ----------- |
| TABLE_CATALOG   | varchar(64) |             |
| TABLE_SCHEMA    | varchar(64) |             |
| TABLE_NAME      | varchar(64) |             |
| TABLE_MODEL     | text        |             |
| TABLE_MODEL_KEY | text        |             |
| DISTRIBUTE_KEY  | text        |             |
| DISTRIBUTE_TYPE | text        |             |
| BUCKETS_NUM     | int         |             |
| PARTITION_NUM   | int         |             |
