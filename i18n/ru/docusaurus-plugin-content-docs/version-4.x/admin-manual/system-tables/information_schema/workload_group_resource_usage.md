---
{
    "title": "workload_group_resource_usage",
    "language": "ru",
    "description": "Хранит сведения об использовании ресурсов Workload Group."
}
---

## Обзор {#overview}

Хранит сведения об использовании ресурсов Workload Group.

## База данных {#database}


`information_schema`


## Информация о таблице {#table-information}

| Имя столбца                  | Тип    | Описание                                  |
| ---------------------------- | ------ | ----------------------------------------- |
| BE_ID                        | bigint | Идентификатор Backend                     |
| WORKLOAD_GROUP_ID            | bigint | Идентификатор Workload Group               |
| MEMORY_USAGE_BYTES           | bigint | Использование памяти в байтах             |
| CPU_USAGE_PERCENT            | double | Использование CPU в процентах             |
| LOCAL_SCAN_BYTES_PER_SECOND  | bigint | Скорость локального сканирования данных в байтах в секунду |
| REMOTE_SCAN_BYTES_PER_SECOND | bigint | Скорость удалённого сканирования данных в байтах в секунду |
