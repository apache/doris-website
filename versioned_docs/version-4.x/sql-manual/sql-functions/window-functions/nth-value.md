---
{
    "title": "NTH_VALUE",
    "language": "en",
    "description": "NTHVALUE() is a window function used to return the Nth value in an ordered dataset within a window partition."
}
---

## Description

NTH_VALUE() is a window function used to return the Nth value in an ordered dataset within a window partition. When N exceeds the valid size of the window, it returns NULL as the result.

## Syntax

```sql
NTH_VALUE(<expr>, <offset>)
```

## Parameters
| Parameter           | Description                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| expr                | The expression from which will get the value value,supported: tinyint/smallint/int/bigint/float/double/decimal/string/date/datetime/array/struct/map/bitmap                                                                    |
| offset         | Bigint type and The parameter offset must be a positive integer greater than 0, indicating the Nth element value to retrieve, with the starting index at 1.                                    |

## Return Value

Returns the same data type as the input expression.

## Examples

```sql
WITH example_data AS (
    SELECT 1 as column1, 66 as column2, 'A' as group_name
    UNION ALL
    SELECT 1, 10, 'A'
    UNION ALL
    SELECT 1, 66, 'A'
    UNION ALL
    SELECT 1, 20, 'A'
    UNION ALL
    SELECT 2, 66, 'B'
    UNION ALL
    SELECT 2, 30, 'B'
    UNION ALL
    SELECT 2, 40, 'B'
)
SELECT 
    group_name,
    column1,
    column2,
    NTH_VALUE(column2, 2) OVER (
        PARTITION BY column1 
        ORDER BY column2
        ROWS BETWEEN 1 preceding and 1 following
    ) as nth
FROM example_data
ORDER BY column1, column2;
```

```text
+------------+---------+---------+------+
| group_name | column1 | column2 | nth  |
+------------+---------+---------+------+
| A          |       1 |      10 |   20 |
| A          |       1 |      20 |   20 |
| A          |       1 |      66 |   66 |
| A          |       1 |      66 |   66 |
| B          |       2 |      30 |   40 |
| B          |       2 |      40 |   40 |
| B          |       2 |      66 |   66 |
+------------+---------+---------+------+
```