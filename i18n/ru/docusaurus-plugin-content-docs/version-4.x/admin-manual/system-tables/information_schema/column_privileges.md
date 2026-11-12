---
{
    "title": "Права доступа к столбцам",
    "language": "ru",
    "description": "Эта таблица используется исключительно для совместимости с поведением MySQL и всегда пуста."
}
---

## Обзор {#overview}

Эта таблица используется исключительно для совместимости с поведением MySQL и всегда пуста. Она не отражает фактические сведения о правах доступа к столбцам в Doris.

## База данных {#database}

```
information_schema
```

## Информация о таблице {#table-information}

| Имя столбца    | Тип          | Описание    |
| -------------- | ------------ | ----------- |
| GRANTEE        | varchar(128) |             |
| TABLE_CATALOG  | varchar(512) |             |
| TABLE_SCHEMA   | varchar(64)  |             |
| TABLE_NAME     | varchar(64)  |             |
| COLUMN_NAME    | varchar(64)  |             |
| PRIVILEGE_TYPE | varchar(64)  |             |
| IS_GRANTABLE   | varchar(3)   |             |
