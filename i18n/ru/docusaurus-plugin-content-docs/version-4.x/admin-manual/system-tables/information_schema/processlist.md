---
{
    "title": "processlist",
    "language": "ru",
    "description": "Просмотр всех текущих подключений"
}
---

## Обзор {#overview}

Просмотр всех текущих подключений

## База данных {#database}


`information_schema`


## Информация о таблице {#table-information}

| Имя столбца       | Тип            | Описание                             |
| ----------------- | -------------- | ------------------------------------ |
| CURRENT_CONNECTED | varchar(16)    | Устаревший столбец, всегда No         |
| ID                | largeint       | Идентификатор подключения            |
| USER              | varchar(32)    | Подключённый пользователь            |
| HOST              | varchar(261)   | Адрес подключения                    |
| LOGIN_TIME        | datetime       | Время входа                          |
| CATALOG           | varchar(64)    | Текущий Catalog                      |
| DB                | varchar(64)    | Текущая база данных                  |
| COMMAND           | varchar(16)    | Тип отправляемой в данный момент команды MySQL |
| TIME              | int            | Время выполнения последнего запроса  |
| STATE             | varchar(64)    | Состояние последнего запроса         |
| QUERY_ID          | varchar(256)   | Идентификатор последнего запроса     |
| INFO              | varchar(65533) | Текст последнего запроса             |
| FE                | varchar(64)    | Front-End (FE), к которому установлено подключение |
| COMPUTE_GROUP     | varchar(64)    | Имя используемой Compute Group       |
