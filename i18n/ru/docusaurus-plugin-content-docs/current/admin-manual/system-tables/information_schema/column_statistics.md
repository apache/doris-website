---
{
    "title": "Статистика столбцов | Информационная схема",
    "language": "ru",
    "description": "Эта таблица используется исключительно для совместимости с поведением MySQL и всегда пуста.",
    "sidebar_label": "Статистика столбцов"
}
---

# Статистика столбцов {#column-statistics}

## Обзор {#overview}

Эта таблица используется исключительно для совместимости с поведением MySQL и всегда пуста. Она не отражает фактическую статистику данных в Doris. Чтобы просмотреть статистику, собранную Doris, см. раздел [Статистика](../../../query-acceleration/optimization-technology-principle/statistics#viewing-column-statistics).

## База данных {#database}


`information_schema`


## Сведения о таблице {#table-information}

| Имя столбца | Тип         | Описание    |
| ----------- | ----------- | ----------- |
| SCHEMA_NAME | varchar(64) |             |
| TABLE_NAME  | varchar(64) |             |
| COLUMN_NAME | varchar(64) |             |
| HISTOGRAM   | json        |             |
