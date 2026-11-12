---
{
    "title": "LAST_VALUE",
    "language": "ru",
    "description": "LASTVALUE() является оконной функцией, которая возвращает последнее значение в пределах рамки окна."
}
---

## Описание {#description}

LAST_VALUE() является оконной функцией, которая возвращает последнее значение в пределах рамки окна. Обработкой значений NULL можно управлять с помощью параметров IGNORE NULL.

## Синтаксис {#syntax}

```sql
LAST_VALUE(<expr>[, <ignore_null>])
```

## Параметры {#parameters}
| Параметр            | Описание                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| expr                | Выражение, из которого извлекается последнее значение. Поддерживаемые типы: tinyint/smallint/int/bigint/float/double/decimal/string/date/datetime/array/struct/map/bitmap                                                             |
| ignore_null         | Необязательный параметр логического типа. Если задан, значения NULL игнорируются и возвращается последнее значение, отличное от NULL                              |

## Возвращаемое значение {#return-value}

Возвращает значение того же типа данных, что и входное выражение.

## Примеры {#examples}

```sql
WITH example_data AS (
    SELECT 1 as id, 21 as myday, '04-21-11' as time_col, NULL as state
    UNION ALL
    SELECT 2, 21, '04-21-12', 2
    UNION ALL
    SELECT 3, 21, '04-21-13', 3
    UNION ALL
    SELECT 4, 22, '04-22-10-21', NULL
    UNION ALL
    SELECT 5, 22, '04-22-10-22', NULL
    UNION ALL
    SELECT 6, 22, '04-22-10-23', 5
    UNION ALL
    SELECT 7, 22, '04-22-10-24', NULL
    UNION ALL
    SELECT 8, 22, '04-22-10-25', 9
    UNION ALL
    SELECT 9, 23, '04-23-11', NULL
    UNION ALL
    SELECT 10, 23, '04-23-12', 10
    UNION ALL
    SELECT 11, 23, '04-23-13', NULL
    UNION ALL
    SELECT 12, 24, '02-24-10-21', NULL
)
SELECT 
    *,
    last_value(`state`, 1) OVER(
        PARTITION BY `myday` 
        ORDER BY `time_col` DESC 
        ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING
    ) as ignore_null,
    last_value(`state`, 0) OVER(
        PARTITION BY `myday` 
        ORDER BY `time_col` DESC 
        ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING
    ) as not_ignore_null,
    last_value(`state`) OVER(
        PARTITION BY `myday` 
        ORDER BY `time_col` DESC 
        ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING
    ) as ignore_null_default
FROM example_data 
ORDER BY `id`, `myday`, `time_col`;
```

```text
+------+-------+-------------+-------+-------------+-----------------+---------------------+
| id   | myday | time_col    | state | ignore_null | not_ignore_null | ignore_null_default |
+------+-------+-------------+-------+-------------+-----------------+---------------------+
|    1 |    21 | 04-21-11    |  NULL |           2 |            NULL |                NULL |
|    2 |    21 | 04-21-12    |     2 |           2 |            NULL |                NULL |
|    3 |    21 | 04-21-13    |     3 |           2 |               2 |                   2 |
|    4 |    22 | 04-22-10-21 |  NULL |        NULL |            NULL |                NULL |
|    5 |    22 | 04-22-10-22 |  NULL |           5 |            NULL |                NULL |
|    6 |    22 | 04-22-10-23 |     5 |           5 |            NULL |                NULL |
|    7 |    22 | 04-22-10-24 |  NULL |           5 |               5 |                   5 |
|    8 |    22 | 04-22-10-25 |     9 |           9 |            NULL |                NULL |
|    9 |    23 | 04-23-11    |  NULL |          10 |            NULL |                NULL |
|   10 |    23 | 04-23-12    |    10 |          10 |            NULL |                NULL |
|   11 |    23 | 04-23-13    |  NULL |          10 |              10 |                  10 |
|   12 |    24 | 02-24-10-21 |  NULL |        NULL |            NULL |                NULL |
+------+-------+-------------+-------+-------------+-----------------+---------------------+
```
