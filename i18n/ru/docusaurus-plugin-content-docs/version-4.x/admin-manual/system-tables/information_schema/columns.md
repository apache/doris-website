---
{
    "title": "columns",
    "language": "ru",
    "description": "Просмотр всей информации о столбцах."
}
---

## Обзор {#overview}

Просмотр всей информации о столбцах.

## База данных {#database}


`information_schema`


## Информация о таблице {#table-information}

| Имя столбца              | Тип           | Описание                                                     |
| ------------------------ | ------------- | ------------------------------------------------------------ |
| TABLE_CATALOG            | varchar(512)  | Имя Catalog                                                  |
| TABLE_SCHEMA             | varchar(64)   | Имя базы данных                                              |
| TABLE_NAME               | varchar(64)   | Имя таблицы                                                  |
| COLUMN_NAME              | varchar(64)   | Имя столбца                                                  |
| ORDINAL_POSITION         | bigint        | Позиция столбца в таблице                                     |
| COLUMN_DEFAULT           | varchar(1024) | Значение столбца по умолчанию                                 |
| IS_NULLABLE              | varchar(3)    | Допускается ли NULL                                           |
| DATA_TYPE                | varchar(64)   | Тип данных                                                   |
| CHARACTER_MAXIMUM_LENGTH | bigint        | Максимальное количество символов для символьных типов         |
| CHARACTER_OCTET_LENGTH   | bigint        | Максимальное количество байтов для символьных типов           |
| NUMERIC_PRECISION        | bigint        | Точность для числовых типов                                   |
| NUMERIC_SCALE            | bigint        | Масштаб для числовых типов                                    |
| DATETIME_PRECISION       | bigint        | Точность для типов даты и времени                             |
| CHARACTER_SET_NAME       | varchar(32)   | Имя набора символов для символьных типов, всегда NULL          |
| COLLATION_NAME           | varchar(32)   | Имя алгоритма сравнения для символьных типов, всегда NULL     |
| COLUMN_TYPE              | varchar(32)   | Тип столбца                                                  |
| COLUMN_KEY               | varchar(3)    | Значение 'UNI' указывает, что столбец входит в Unique Key      |
| EXTRA                    | varchar(27)   | Дополнительная информация о столбце, в том числе о том, является ли он столбцом с автоинкрементом, вычисляемым столбцом и т. д. |
| PRIVILEGES               | varchar(80)   | Всегда пустое значение                                       |
| COLUMN_COMMENT           | varchar(255)  | Комментарий к столбцу                                        |
| COLUMN_SIZE              | bigint        | Ширина столбца                                               |
| DECIMAL_DIGITS           | bigint        | Количество знаков после запятой для числовых типов            |
| GENERATION_EXPRESSION    | varchar(64)   | Всегда NULL                                                  |
| SRS_ID                   | bigint        | Всегда NULL                                                  |
