---
{
    "title": "NTILE",
    "language": "en"
}
---

## Description

NTILE() is a window function that divides an ordered dataset into a specified number of approximately equal buckets. The buckets are numbered sequentially starting from 1 up to the specified number of buckets. When data cannot be divided equally, extra records are allocated to lower-numbered buckets, ensuring that the number of rows in each bucket differs by at most 1.

## Syntax

```sql
NTILE( <constant_value> )
```

## Parameters
| Parameter      | Description                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| constant_value | Required. Specifies the number of buckets to create, must be a positive integer                                             

## Return Value

Returns a BIGINT bucket number, ranging from 1 to the specified number of buckets.

## Usage Notes

If a statement contains both an ORDER BY clause in the NTILE function and an ORDER BY clause for the output results, these two sorts are independent:
- The ORDER BY in the NTILE function determines which bucket each row is assigned to
- The output ORDER BY determines the display order of the results

## Examples

```sql
SELECT 
    name,
    score,
    NTILE(4) OVER (ORDER BY score DESC) as quarter
FROM student_scores;
```

```text
+----------+-------+---------+
| name     | score | quarter |
+----------+-------+---------+
| Alice    | 98    | 1       |  -- Top 25% scores
| Bob      | 95    | 1       |
| Charlie  | 90    | 2       |  -- 25-50% scores
| David    | 85    | 2       |
| Eve      | 82    | 3       |  -- 50-75% scores
| Frank    | 78    | 3       |
| Grace    | 75    | 4       |  -- Bottom 25% scores
| Henry    | 70    | 4       |
+----------+-------+---------+
```
