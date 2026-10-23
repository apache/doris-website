---
{
    "title": "profiling",
    "language": "ru",
    "description": "Эта таблица предназначена исключительно для обеспечения совместимости с поведением MySQL. Она всегда пуста."
}
---

## Обзор {#overview}

Эта таблица предназначена исключительно для обеспечения совместимости с поведением MySQL. Она всегда пуста.

## База данных {#database}


`information_schema`


## Информация о таблице {#table-information}

| Имя столбца         | Тип         | Описание    |
| ------------------- | ----------- | ----------- |
| QUERY_ID            | int         |             |
| SEQ                 | int         |             |
| STATE               | varchar(30) |             |
| DURATION            | double      |             |
| CPU_USER            | double      |             |
| CPU_SYSTEM          | double      |             |
| CONTEXT_VOLUNTARY   | int         |             |
| CONTEXT_INVOLUNTARY | int         |             |
| BLOCK_OPS_IN        | int         |             |
| BLOCK_OPS_OUT       | int         |             |
| MESSAGES_SENT       | int         |             |
| MESSAGES_RECEIVED   | int         |             |
| PAGE_FAULTS_MAJOR   | int         |             |
| PAGE_FAULTS_MINOR   | int         |             |
| SWAPS               | int         |             |
| SOURCE_FUNCTION     | varchar(30) |             |
| SOURCE_FILE         | varchar(20) |             |
| SOURCE_LINE         | int         |             |
