---
{
    "title": "Триггеры",
    "language": "ru",
    "description": "Содержит информацию о триггерах. Doris поддерживает эту таблицу для совместимости с MySQL; она всегда пуста."
}
---

## Обзор {#overview}

Таблица `triggers` содержит информацию о триггерах.
В настоящее время Apache Doris поддерживает эту таблицу для совместимости с MySQL, но не поддерживает пользовательские триггеры. Эта таблица всегда пуста.

## База данных {#database}

`information_schema`

## Сведения о таблице {#table-information}

| Имя столбца | Тип | Описание |
|---|---|---|
| TRIGGER_CATALOG | varchar(512) | Имя Catalog, которому принадлежит триггер. Всегда 'def'. |
| TRIGGER_SCHEMA | varchar(64) | Имя схемы (базы данных), которой принадлежит триггер. |
| TRIGGER_NAME | varchar(64) | Имя триггера. |
| EVENT_MANIPULATION | varchar(6) | Событие, вызывающее срабатывание триггера (INSERT, UPDATE, DELETE). |
| EVENT_OBJECT_CATALOG | varchar(512) | Имя Catalog таблицы, с которой связан триггер. Всегда 'def'. |
| EVENT_OBJECT_SCHEMA | varchar(64) | Имя схемы (базы данных) таблицы, с которой связан триггер. |
| EVENT_OBJECT_TABLE | varchar(64) | Имя таблицы, с которой связан триггер. |
| ACTION_ORDER | bigint | Порядковый номер триггера в порядке определения. |
| ACTION_CONDITION | varchar(512) | null |
| ACTION_STATEMENT | varchar(512) | Тело триггера. |
| ACTION_ORIENTATION | varchar(9) | Всегда 'ROW'. |
| ACTION_TIMING | varchar(6) | Момент срабатывания триггера (BEFORE, AFTER). |
| ACTION_REFERENCE_OLD_TABLE | varchar(64) | null |
| ACTION_REFERENCE_NEW_TABLE | varchar(64) | null |
| ACTION_REFERENCE_OLD_ROW | varchar(3) | Всегда 'OLD'. |
| ACTION_REFERENCE_NEW_ROW | varchar(3) | Всегда 'NEW'. |
| CREATED | datetime | Время создания триггера. |
| SQL_MODE | varchar(8192) | Режим SQL, действовавший на момент создания триггера. |
| DEFINER | varchar(77) | Учётная запись, создавшая триггер. |
| CHARACTER_SET_CLIENT | varchar(32) | Значение системной переменной character_set_client для сеанса на момент создания триггера. |
| COLLATION_CONNECTION | varchar(32) | Значение системной переменной collation_connection для сеанса на момент создания триггера. |
| DATABASE_COLLATION | varchar(32) | Порядок сортировки базы данных, с которой связан триггер. |
