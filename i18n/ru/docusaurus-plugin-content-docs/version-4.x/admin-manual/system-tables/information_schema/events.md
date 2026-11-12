---
{
    "title": "events",
    "language": "ru",
    "description": "Эта таблица используется исключительно для совместимости с поведением MySQL и всегда пуста."
}
---

## Обзор {#overview}

Эта таблица используется исключительно для совместимости с поведением MySQL и всегда пуста.

## База данных {#database}


`information_schema`


## Сведения о таблице {#table-information}

| Имя столбца          | Тип           | Описание    |
| -------------------- | ------------- | ----------- |
| EVENT_CATALOG        | varchar(64)   |             |
| EVENT_SCHEMA         | varchar(64)   |             |
| EVENT_NAME           | varchar(64)   |             |
| DEFINER              | varchar(77)   |             |
| TIME_ZONE            | varchar(64)   |             |
| EVENT_BODY           | varchar(8)    |             |
| EVENT_DEFINITION     | varchar(512)  |             |
| EVENT_TYPE           | varchar(9)    |             |
| EXECUTE_AT           | datetime      |             |
| INTERVAL_VALUE       | varchar(256)  |             |
| INTERVAL_FIELD       | varchar(18)   |             |
| SQL_MODE             | varchar(8192) |             |
| STARTS               | datetime      |             |
| ENDS                 | datetime      |             |
| STATUS               | varchar(18)   |             |
| ON_COMPLETION        | varchar(12)   |             |
| CREATED              | datetime      |             |
| LAST_ALTERED         | datetime      |             |
| LAST_EXECUTED        | datetime      |             |
| EVENT_COMMENT        | varchar(64)   |             |
| ORIGINATOR           | int           |             |
| CHARACTER_SET_CLIENT | varchar(32)   |             |
| COLLATION_CONNECTION | varchar(32)   |             |
| DATABASE_COLLATION   | varchar(32)   |             |
