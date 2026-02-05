---
{
    "title": "STDDEV,STDDEV_POP",
    "language": "en",
    "description": "Returns the standard deviation of the expr expression"
}
---

## Description

Returns the standard deviation of the expr expression

## Alias

- STDDEV_POP

## Syntax

```sql
STDDEV(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The value to be calculated standard deviation |

## Return Value

Return the standard deviation of the expr expression

## Examples
```sql
-- Create sample tables
CREATE TABLE score_table (
    student_id INT,
    score DOUBLE
) DISTRIBUTED BY HASH(student_id)
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO score_table VALUES
(1, 85),
(2, 90),
(3, 82),
(4, 88),
(5, 95);

-- Calculate the standard deviation of all students' scores
SELECT STDDEV(score) as score_stddev
FROM score_table;
```

```text
+-------------------+
| score_stddev      |
+-------------------+
| 4.427188724235729 |
+-------------------+
```
