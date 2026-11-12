---
{
    "title": "Статистика столбцов | Внутренняя схема",
    "language": "ru",
    "description": "Статистика столбцов",
    "sidebar_label": "Статистика столбцов"
}
---

# Статистика столбцов {#column-statistics}

## Обзор {#overview}

Статистика столбцов

## База данных {#database}


`__internal_schema`


## Сведения о таблице {#table-information}

| Имя столбца        | Тип            | Описание                                         |
| ------------------ | -------------- | ------------------------------------------------ |
| id                 | varchar(4096)  | Уникальный ID                                    |
| catalog_id         | varchar(64)    | ID Catalog                                       |
| db_id              | varchar(64)    | ID базы данных                                   |
| tbl_id             | varchar(64)    | ID таблицы                                       |
| idx_id             | varchar(64)    | ID индекса                                       |
| col_id             | varchar(64)    | ID столбца; в настоящее время хранит имена столбцов |
| part_id            | varchar(64)    | ID раздела, всегда пустой                         |
| count              | bigint         | Количество строк                                 |
| ndv                | bigint         | Количество уникальных значений                   |
| null_count         | bigint         | Количество значений NULL                         |
| min                | varchar(65533) | Минимальное значение                             |
| max                | varchar(65533) | Максимальное значение                            |
| data_size_in_bytes | bigint         | Размер данных в байтах                           |
| update_time        | datetime       | Время обновления текущей статистики               |
