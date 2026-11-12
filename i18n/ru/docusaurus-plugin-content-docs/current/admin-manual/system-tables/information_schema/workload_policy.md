---
{
    "title": "workload_policy",
    "language": "ru",
    "description": "Содержит сведения о конфигурации Workload Policies."
}
---

## Обзор {#overview}

Содержит сведения о конфигурации Workload Policies.

## База данных {#database}


`information_schema`


## Информация о таблице {#table-information}

| Имя столбца    | Тип          | Описание                                       |
| -------------- | ------------ | ---------------------------------------------- |
| ID             | bigint       | Идентификатор Workload Policy                   |
| NAME           | varchar(256) | Имя Workload Policy                             |
| CONDITION      | text         | Условие Workload Policy                         |
| ACTION         | text         | Действие Workload Policy                        |
| PRIORITY       | int          | Приоритет Workload Policy                       |
| ENABLED        | boolean      | Включена ли Workload Policy                     |
| VERSION        | int          | Версия Workload Policy                          |
| WORKLOAD_GROUP | text         | Имя группы Workload Group, привязанной к политике |
