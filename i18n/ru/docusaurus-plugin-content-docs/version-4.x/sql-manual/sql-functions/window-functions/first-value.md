---
{
    "title": "FIRST_VALUE",
    "language": "ru",
    "description": "Оконная функция FIRSTVALUE() возвращает первое значение в упорядоченном наборе значений в пределах секции окна."
}
---

## Описание {#description}

Оконная функция FIRST_VALUE() возвращает первое значение в упорядоченном наборе значений в пределах секции окна. Обработку значений NULL можно настроить с помощью опций IGNORE NULL.

## Синтаксис {#syntax}

```sql
FIRST_VALUE(expr[, ignore_null])
```

## Параметры {#parameters}
| Параметр            | Описание                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| expr                | Выражение, из которого извлекается первое значение. Поддерживаемые типы: tinyint/smallint/int/bigint/float/double/decimal/string/date/datetime/array/struct/map/bitmap                                                                    |
| ignore_null         | Необязательный параметр типа boolean. Если задан, значения NULL игнорируются и возвращается первое значение, отличное от NULL                                     |

## Возвращаемое значение {#return-value}

Возвращает значение того же типа данных, что и входное выражение.

## Примеры {#examples}

```sql
WITH example_data AS (
    SELECT 1 as column1, NULL as column2, 'A' as group_name
    UNION ALL
    SELECT 1, 10, 'A'
    UNION ALL
    SELECT 1, NULL, 'A'
    UNION ALL
    SELECT 1, 20, 'A'
    UNION ALL
    SELECT 2, NULL, 'B'
    UNION ALL
    SELECT 2, 30, 'B'
    UNION ALL
    SELECT 2, 40, 'B'
)
SELECT 
    group_name,
    column1,
    column2,
    FIRST_VALUE(column2) OVER (
        PARTITION BY column1 
        ORDER BY column2 NULLS LAST
    ) AS first_value_default,
    FIRST_VALUE(column2, true) OVER (
        PARTITION BY column1 
        ORDER BY column2
    ) AS first_value_ignore_null
FROM example_data
ORDER BY column1, column2;
```

```text
+------------+---------+---------+---------------------+-------------------------+
| group_name | column1 | column2 | first_value_default | first_value_ignore_null |
+------------+---------+---------+---------------------+-------------------------+
| A          |       1 |    NULL |                  10 |                    NULL |
| A          |       1 |    NULL |                  10 |                    NULL |
| A          |       1 |      10 |                  10 |                      10 |
| A          |       1 |      20 |                  10 |                      10 |
| B          |       2 |    NULL |                  30 |                    NULL |
| B          |       2 |      30 |                  30 |                      30 |
| B          |       2 |      40 |                  30 |                      30 |
+------------+---------+---------+---------------------+-------------------------+
```
