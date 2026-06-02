---
{
    "title": "GROUPING_ID",
    "language": "en",
    "description": "Computes the level of grouping for rows in a GROUP BY query."
}
---

## Description

Computes the level of grouping for rows in a GROUP BY query. The GROUPING_ID function returns an integer bitmap indicating which columns in the GROUP BY list are not aggregated for a given output row. It can be used in the SELECT list or HAVING clause when a GROUP BY is specified.

## Syntax

```sql
GROUPING_ID(<column_expression> [, ...])
```

## Parameters

| Parameters               | Description                                       |
|-------------------------|---------------------------------------------------|
| `<column_expression>`   | A column expression from the GROUP BY clause.     |

## Return Value

Returns a BIGINT value representing the grouping bitmap for the given columns.

## Examples

### Example A: Filter result set using GROUPING_ID

```sql
SELECT
  department,
  CASE 
    WHEN GROUPING_ID(department, level) = 0 THEN level
    WHEN GROUPING_ID(department, level) = 1 THEN CONCAT('Total: ', department)
    WHEN GROUPING_ID(department, level) = 3 THEN 'Total: Company'
    ELSE 'Unknown'
  END AS `Job Title`,
  COUNT(uid) AS `Count`
FROM employee 
GROUP BY ROLLUP(department, level)
HAVING `Job Title` = 'Senior';
```

*Expected Output:*

```text
+--------------------+-----------+-------+
| department         | Job Title | Count |
+--------------------+-----------+-------+
| Board of Directors | Senior    |     2 |
| Technology         | Senior    |     3 |
| Sales              | Senior    |     1 |
| Marketing          | Senior    |     1 |
+--------------------+-----------+-------+
```
