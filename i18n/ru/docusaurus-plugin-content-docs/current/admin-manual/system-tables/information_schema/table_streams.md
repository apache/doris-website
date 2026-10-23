---
{
    "title": "table_streams",
    "language": "ru",
    "description": "Содержит определения всех Table Stream в кластере и сведения об их состоянии."
}
---

## Обзор {#overview}

Содержит определения всех Table Stream в кластере и сведения об их состоянии. Каждая строка соответствует одному Stream. Подробнее об использовании см. в разделе [Основы работы с Table Stream](../../../data-operate/incremental/table-stream).

## База данных {#database}

`information_schema`

## Информация о таблице {#table-information}

| Столбец | Тип | Описание |
| :--- | :--- | :--- |
| DB_NAME | varchar(64) | База данных Stream |
| STREAM_NAME | varchar(64) | Имя Stream |
| STREAM_ID | bigint | Идентификатор Stream |
| STREAM_TYPE | varchar(64) | Тип Stream; Stream для внутренних таблиц имеют тип `OLAP_TABLE_STREAM` |
| CONSUME_TYPE | varchar(64) | Тип потребления: `APPEND_ONLY`, `MIN_DELTA`, `DETAIL` |
| STREAM_COMMENT | string | Комментарий к Stream |
| BASE_TABLE_NAME | varchar(64) | Имя базовой таблицы |
| BASE_TABLE_DB | varchar(64) | База данных базовой таблицы |
| BASE_TABLE_CTL | varchar(64) | Catalog базовой таблицы |
| BASE_TABLE_TYPE | varchar(64) | Тип базовой таблицы |
| ENABLED | boolean | Доступен ли Stream для использования |
| IS_STALE | boolean | Устарел ли Stream (например, если записи изменений были удалены и он больше не может читать данные со своего смещения потребления) |
| STALE_REASON | string | Причина устаревания; `N/A`, если Stream не устарел |

## Примеры {#examples}

```sql
SELECT STREAM_NAME, CONSUME_TYPE, BASE_TABLE_DB, BASE_TABLE_NAME, ENABLED, IS_STALE, STALE_REASON
FROM information_schema.table_streams
WHERE DB_NAME = 'demo';
```

```text
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| STREAM_NAME   | CONSUME_TYPE | BASE_TABLE_DB | BASE_TABLE_NAME | ENABLED | IS_STALE | STALE_REASON |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| orders_stream | MIN_DELTA    | demo          | orders          |       1 |        0 | N/A          |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
```
