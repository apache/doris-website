---
{
    "title": "schemata",
    "language": "ru",
    "description": "Просмотр информации о базе данных."
}
---

## Обзор {#overview}

Просмотр информации о базе данных.

## База данных {#database}


`information_schema`


## Информация о таблице {#table-information}

| Имя столбца                | Тип          | Описание                                              |
| -------------------------- | ------------ | ----------------------------------------------------- |
| CATALOG_NAME               | varchar(512) | Имя Catalog                                           |
| SCHEMA_NAME                | varchar(32)  | Имя базы данных                                       |
| DEFAULT_CHARACTER_SET_NAME | varchar(32)  | Только для совместимости с MySQL; никаких функций не выполняет |
| DEFAULT_COLLATION_NAME     | varchar(32)  | Только для совместимости с MySQL; никаких функций не выполняет |
| SQL_PATH                   | varchar(512) | Только для совместимости с MySQL; никаких функций не выполняет |
| DEFAULT_ENCRYPTION         | varchar(3)   | Только для совместимости с MySQL; никаких функций не выполняет |
