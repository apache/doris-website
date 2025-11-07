---
{
    "title": "SKEW,SKEW_POP,SKEWNESS",
    "language": "en"
}
---

## Description

Returns the [skewness](https://en.wikipedia.org/wiki/Skewness) of the expr expression.
The formula used for this function is `3rd central moment / ((variance)^{1.5})`.

**Related Commands**

[kurt](./kurt.md)

## Alias

- SKEW
- SKEW_POP

## Syntax

```sql
SKEWNESS(<col>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<col>` | The column to be calculated skewness, supports type Double. |

## Return Value

Returns the skewness of the expr expression, which is a Double type.
If variance is zero, returns NULL.
If there is no valid data in the group, returns NULL.

## Examples
```sql
CREATE TABLE statistic_test(
    tag int, 
    val1 double not null, 
    val2 double null
) DISTRIBUTED BY HASH(tag)
PROPERTIES (
    "replication_num"="1"
);

INSERT INTO statistic_test VALUES
(1, -10, -10),
(2, -20, NULL),
(3, 100, NULL),
(4, 100, NULL),
(5, 1000,1000);

-- NULL is ignored
SELECT 
  skew(val1), 
  skew(val2)
FROM statistic_test;
```

```text
+--------------------+------------+
| skew(val1)         | skew(val2) |
+--------------------+------------+
| 1.4337199628825619 |          0 |
+--------------------+------------+
```

```sql
-- Each group just has one row, result is NULL
SELECT 
  skew(val1), 
  skew(val2) 
FROM statistic_test
GROUP BY tag;
```

```text
+------------+------------+
| skew(val1) | skew(val2) |
+------------+------------+
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
+------------+------------+
```