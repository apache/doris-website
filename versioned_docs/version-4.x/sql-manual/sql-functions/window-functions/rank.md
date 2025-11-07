---
{
    "title": "RANK",
    "language": "en"
}
---

## Description

RANK() is a window function that returns the rank of values in an ordered dataset. Rankings start at 1 and increment sequentially. When identical values occur, they receive the same rank, but this creates gaps in the ranking sequence. For example, if the first two rows are tied for rank 1, the next different value will be ranked 3 (not 2).

## Syntax

```sql
RANK()
```

## Return Value

Returns a BIGINT rank value. Returns the same rank for identical values, but creates gaps in the sequence.

## Examples

```sql
SELECT 
    department,
    employee_name,
    salary,
    RANK() OVER (
        PARTITION BY department 
        ORDER BY salary DESC
    ) as salary_rank
FROM employees;
```

```text
+------------+---------------+--------+-------------+
| department | employee_name | salary | salary_rank |
+------------+---------------+--------+-------------+
| Sales      | Alice        | 10000  | 1           |
| Sales      | Bob          | 10000  | 1           |
| Sales      | Charlie      | 8000   | 3           |  -- Note this is 3, not 2
| IT         | David        | 12000  | 1           |
| IT         | Eve          | 11000  | 2           |
| IT         | Frank        | 11000  | 2           |
| IT         | Grace        | 9000   | 4           |  -- Note this is 4, not 3
+------------+---------------+--------+-------------+
```

In this example, the data is partitioned by department and ranked by salary within each department. When identical salaries occur (like Alice and Bob, Eve and Frank), they receive the same rank, but this creates gaps in subsequent rankings.
