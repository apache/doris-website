---
{
    "title": "procs_priv",
    "language": "ru",
    "description": "Эта таблица предназначена исключительно для совместимости с поведением MySQL. Она всегда пуста."
}
---

## Обзор {#overview}

Эта таблица предназначена исключительно для совместимости с поведением MySQL. Она всегда пуста.

## База данных {#database}


`mysql`


## Сведения о таблице {#table-information}

| Имя столбца  | Тип      | Описание    |
| ------------ | -------- | ----------- |
| host         | char(60) |             |
| db           | char(64) |             |
| user         | char(32) |             |
| routine_name | char(64) |             |
| routine_type | char(9)  |             |
| grantor      | char(93) |             |
| proc_priv    | char(16) |             |
| timestamp    | char(1)  |             |
