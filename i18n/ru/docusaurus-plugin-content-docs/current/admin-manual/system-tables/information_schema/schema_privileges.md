---
{
    "title": "schema_privileges",
    "language": "ru",
    "description": "Просмотр сведений о правах доступа к базе данных."
}
---

## Обзор {#overview}

Просмотр сведений о правах доступа к базе данных.

## База данных {#database}


`information_schema`


## Сведения о таблице {#table-information}

| Имя столбца    | Тип          | Описание                                            |
| -------------- | ------------ | --------------------------------------------------- |
| GRANTEE        | varchar(81)  | Пользователь, которому предоставлены права          |
| TABLE_CATALOG  | varchar(512) | Имя Catalog, всегда 'def'                           |
| TABLE_SCHEMA   | varchar(64)  | Имя базы данных                                     |
| PRIVILEGE_TYPE | varchar(64)  | Тип права доступа                                   |
| IS_GRANTABLE   | varchar(3)   | Можно ли предоставлять права другим пользователям  |
