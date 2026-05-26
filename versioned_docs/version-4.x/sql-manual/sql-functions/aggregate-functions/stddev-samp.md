---
{
    "title": "STDDEV_SAMP",
    "language": "en",
    "description": "Returns the sample standard deviation of the expr expression"
}
---

## Description

Returns the sample standard deviation of the expr expression

The calculation formula is:

$
\mathrm{STDDEV\_SAMP}(x)=\sqrt{\mathrm{VAR\_SAMP}(x)}=\sqrt{\frac{\sum_{i=1}^{n}(x_i-\bar{x})^2}{n-1}}
$

Where `n` is the number of valid values in the group.

## Syntax

```sql
STDDEV_SAMP(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The value to be calculated standard deviation, supports type Double. |

## Return Value

Return the sample standard deviation of the expr expression as Double type.
If there is no valid data in the group, returns NULL. If the number of valid values in the group is 1, returns NaN.

### Examples
```sql
-- Create sample table
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

When the number of valid values is 1, `STDDEV_SAMP` returns `NaN`.

```sql
-- Create a single-column sample table
CREATE TABLE sample_values (
    value INT
) DISTRIBUTED BY HASH(value)
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO sample_values VALUES (10);

SELECT STDDEV_SAMP(value) AS sample_stddev FROM sample_values;
+---------------+
| sample_stddev |
+---------------+
|           NaN |
+---------------+
```
