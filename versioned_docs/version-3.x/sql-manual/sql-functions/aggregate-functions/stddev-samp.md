---
{
    "title": "STDDEV_SAMP",
    "language": "en",
    "description": "Returns the sample standard deviation of the expr expression"
}
---

## Description

Returns the sample standard deviation of the expr expression

## Syntax

```sql
STDDEV_SAMP(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The value to be calculated standard deviation |

## Return Value

Return the sample standard deviation of the expr expression

### Examples
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

-- Calculate the sample standard deviation of all students' scores
SELECT STDDEV_SAMP(score) as score_stddev
FROM score_table;
```

```text
+-------------------+
| score_stddev      |
+-------------------+
| 4.949747468305831 |
+-------------------+
```
