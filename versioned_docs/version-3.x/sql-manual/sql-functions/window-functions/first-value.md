---
{
    "title": "FIRST_VALUE",
    "language": "en",
    "description": "FIRSTVALUE() is a window function that returns the first value in an ordered set of values within a window partition."
}
---

## Description

FIRST_VALUE() is a window function that returns the first value in an ordered set of values within a window partition. The handling of null values can be controlled using the IGNORE NULLS options.

## Syntax

```sql
FIRST_VALUE(expr[, ignore_null])
```

## Parameters
| Parameter           | Description                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| expr                | The expression from which to get the first value                                                                    |
| ignore_null         | Optional. When set, null values are ignored, returning the first non-null value                                     |

## Return Value

Returns the same data type as the input expression.

## Examples

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