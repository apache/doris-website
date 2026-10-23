---
{
    "title": "partition_statistics",
    "language": "ru",
    "description": "Статистика разделов"
}
---

## Обзор {#overview}

Статистика разделов

## База данных {#database}


`__internal_schema`


## Информация о таблице {#table-information}

| Имя столбца        | Тип            | Описание                                         |
| ------------------ | -------------- | ------------------------------------------------ |
| catalog_id         | varchar(64)    | ID Catalog                                       |
| db_id              | varchar(64)    | ID базы данных                                   |
| tbl_id             | varchar(64)    | ID таблицы                                       |
| idx_id             | varchar(64)    | ID индекса                                       |
| part_name          | varchar(64)    | Имя раздела                                      |
| part_id            | bigint         | ID раздела                                       |
| col_id             | varchar(64)    | ID столбца; в настоящее время хранит имена столбцов |
| count              | bigint         | Количество строк                                 |
| ndv                | hll            | Количество уникальных значений                   |
| null_count         | bigint         | Количество значений NULL                         |
| min                | varchar(65533) | Минимальное значение                             |
| max                | varchar(65533) | Максимальное значение                            |
| data_size_in_bytes | bigint         | Размер данных в байтах                           |
| update_time        | datetime       | Время последнего обновления текущей статистики   |
