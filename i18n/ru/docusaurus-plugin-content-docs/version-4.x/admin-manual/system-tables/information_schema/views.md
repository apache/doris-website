---
{
    "title": "views",
    "language": "ru",
    "description": "Содержит информацию обо всех представлениях."
}
---

## Обзор {#overview}

Содержит информацию обо всех представлениях.

## База данных {#database}


`information_schema`


## Информация о таблице {#table-information}

| Имя столбца          | Тип           | Описание                                          |
| -------------------- | ------------- | ------------------------------------------------- |
| TABLE_CATALOG        | varchar(512)  | Имя Catalog                                       |
| TABLE_SCHEMA         | varchar(64)   | Имя базы данных                                   |
| TABLE_NAME           | varchar(64)   | Имя представления                                 |
| VIEW_DEFINITION      | varchar(8096) | Оператор определения представления                |
| CHECK_OPTION         | varchar(8)    | Не влияет на работу, служит только для совместимости с MySQL |
| IS_UPDATABLE         | varchar(3)    | Не влияет на работу, служит только для совместимости с MySQL |
| DEFINER              | varchar(77)   | Не влияет на работу, служит только для совместимости с MySQL |
| SECURITY_TYPE        | varchar(7)    | Не влияет на работу, служит только для совместимости с MySQL |
| CHARACTER_SET_CLIENT | varchar(32)   | Не влияет на работу, служит только для совместимости с MySQL |
| COLLATION_CONNECTION | varchar(32)   | Не влияет на работу, служит только для совместимости с MySQL |
