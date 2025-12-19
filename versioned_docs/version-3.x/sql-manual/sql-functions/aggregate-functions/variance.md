---
{
    "title": "VARIANCE,VAR_POP,VARIANCE_POP",
    "language": "en",
    "description": "The VARIANCE function calculates the statistical variance of the specified expression."
}
---

## Description

The VARIANCE function calculates the statistical variance of the specified expression. It measures how far a set of numbers are spread out from their arithmetic mean.

## Alias

- VAR_POP
- VARIANCE_POP

## Syntax

```sql
VARIANCE(<expr>)
```

## Parameters
| Parameter | Description |
| -- | -- |
| `<expr>` | The column or expression to calculate variance for. Must be numeric type |

## Return Value
Returns a DOUBLE value representing the calculated variance.

## Examples
```sql
-- Create sample table
CREATE TABLE student_scores (
    student_id INT,
    score DECIMAL(4,1)
) DISTRIBUTED BY HASH(student_id)
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO student_scores VALUES
(1, 85.5),
(2, 92.0),
(3, 78.5),
(4, 88.0),
(5, 95.5),
(6, 82.0),
(7, 90.0),
(8, 87.5);
-- Calculate variance of student scores
SELECT VARIANCE(score) as score_variance
FROM student_scores;
```

```text
+-------------------+
| score_variance    |
+-------------------+
| 25.73437499999998 |
+-------------------+
```
