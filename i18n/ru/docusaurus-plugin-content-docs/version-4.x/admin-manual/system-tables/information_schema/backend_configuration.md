---
{
    "title": "backend_configuration",
    "language": "ru",
    "description": "Просмотр параметров конфигурации узлов Backend."
}
---

## Обзор {#overview}

Просмотр параметров конфигурации узлов Backend.

## База данных {#database}


`information_schema`


## Информация о таблице {#table-information}

| Имя столбца  | Тип          | Описание                              |
| ------------ | ------------ | ------------------------------------- |
| BE_ID        | bigint       | Идентификатор узла Backend             |
| CONFIG_NAME  | varchar(256) | Имя параметра конфигурации             |
| CONFIG_TYPE  | varchar(256) | Тип данных параметра конфигурации      |
| CONFIG_VALUE | bigint       | Значение параметра конфигурации        |
| IS_MUTABLE   | bool         | Можно ли изменять параметр конфигурации |
