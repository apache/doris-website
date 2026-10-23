---
{
    "title": "таблицы",
    "language": "ru",
    "description": "Хранит информацию обо всех таблицах."
}
---

## Обзор {#overview}

Хранит информацию обо всех таблицах.

## База данных {#database}


`information_schema`


## Информация о таблице {#table-information}

| Имя столбца     | Тип           | Описание                                                     |
| --------------- | ------------- | ------------------------------------------------------------ |
| TABLE_CATALOG   | varchar(512)  | Catalog, которому принадлежит таблица                        |
| TABLE_SCHEMA    | varchar(64)   | База данных, которой принадлежит таблица                     |
| TABLE_NAME      | varchar(64)   | Имя таблицы                                                 |
| TABLE_TYPE      | varchar(64)   | Тип таблицы: SYSTEM VIEW, VIEW, BASE TABLE                   |
| ENGINE          | varchar(64)   | Тип движка хранения таблицы                                 |
| VERSION         | bigint        | Недействительное значение                                   |
| ROW_FORMAT      | varchar(10)   | Недействительное значение                                   |
| TABLE_ROWS      | bigint        | Оценочное количество строк в таблице                        |
| AVG_ROW_LENGTH  | bigint        | Средний размер строки таблицы                               |
| DATA_LENGTH     | bigint        | Оценочный размер таблицы                                    |
| MAX_DATA_LENGTH | bigint        | Недействительное значение                                   |
| INDEX_LENGTH    | bigint        | Недействительное значение                                   |
| DATA_FREE       | bigint        | Недействительное значение                                   |
| AUTO_INCREMENT  | bigint        | Недействительное значение                                   |
| CREATE_TIME     | datetime      | Время создания таблицы                                      |
| UPDATE_TIME     | datetime      | Время последнего обновления данных таблицы                   |
| CHECK_TIME      | datetime      | Недействительное значение                                   |
| TABLE_COLLATION | varchar(32)   | Фиксированное значение: utf-8                                |
| CHECKSUM        | bigint        | Недействительное значение                                   |
| CREATE_OPTIONS  | varchar(255)  | Недействительное значение                                   |
| TABLE_COMMENT   | varchar(2048) | Комментарии к таблице                                       |
