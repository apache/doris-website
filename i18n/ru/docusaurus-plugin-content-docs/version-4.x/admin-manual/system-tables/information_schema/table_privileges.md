---
{
    "title": "table_privileges",
    "language": "ru",
    "description": "Просмотр сведений о правах доступа к таблице."
}
---

## Обзор {#overview}

Просмотр сведений о правах доступа к таблице.

## База данных {#database}


`information_schema`


## Информация о таблице {#table-information}

| Имя столбца    | Тип          | Описание                                       |
| -------------- | ------------ | ---------------------------------------------- |
| GRANTEE        | varchar(81)  | Пользователь, которому предоставлены права      |
| TABLE_CATALOG  | varchar(512) | Имя Catalog                                    |
| TABLE_SCHEMA   | varchar(64)  | Имя базы данных                                |
| TABLE_NAME     | varchar(64)  | Имя таблицы                                    |
| PRIVILEGE_TYPE | varchar(64)  | Тип права доступа                              |
| IS_GRANTABLE   | varchar(3)   | Можно ли предоставлять это право другим пользователям |
