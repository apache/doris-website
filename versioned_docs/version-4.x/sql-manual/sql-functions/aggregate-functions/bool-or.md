---
{
"title": "BOOL_OR",
"language": "en"
}
---

## Description

Performs a logical OR aggregation over all non-NULL values of the expression.

## Alias

- BOOLOR_AGG

## Syntax

```text
BOOL_OR(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | Expression to be aggregated with logical OR. Supports BOOLEAN type and numeric types that can be converted to boolean by the 0/non-0 rule (0 is FALSE, non-0 is TRUE). |

## Return Value

The return value is BOOLEAN. It returns TRUE when all non-NULL values exist, otherwise it returns FALSE.

If all values of the expression are NULL or the expression is empty, the function returns NULL.

## Examples

Setup :
```sql
CREATE TABLE IF NOT EXISTS test_boolean_agg (
     id INT,
     c1 BOOLEAN,
     c2 BOOLEAN,
     c3 BOOLEAN,
     c4 BOOLEAN
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1"); 

INSERT INTO test_boolean_agg (id, c1, c2, c3, c4) values 
(1, true, true, true, false),
(2, true, false, false, false),
(3, true, true, false, false),
(4, true, false, false, false);
```

### Aggregate function:
```sql
SELECT BOOLOR_AGG(c1), BOOLOR_AGG(c2), BOOLOR_AGG(c3), BOOLOR_AGG(c4)
FROM test_boolean_agg;
```
```text
+----------------+----------------+----------------+----------------+
| BOOLOR_AGG(c1) | BOOLOR_AGG(c2) | BOOLOR_AGG(c3) | BOOLOR_AGG(c4) |
+----------------+----------------+----------------+----------------+
|              1 |              1 |              1 |              0 |
+----------------+----------------+----------------+----------------+
```


BOOL_OR also accepts numeric types; non-zero values are treated as `TRUE`:
```sql
CREATE TABLE test_numeric_or_null (
    id INT,
    c_int INT,
    c_float FLOAT,
    c_decimal DECIMAL(10,2),
    c_bool BOOLEAN
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test_numeric_or_null (id, c_int, c_float, c_decimal, c_bool) VALUES
(1, 1, 1.0, NULL, NULL),
(2, 0, NULL, 0.00, NULL),
(3, 1, 3.14, 1.00, NULL),
(4, 0, 1.0, 0.00, NULL),
(5, NULL, NULL, NULL, NULL);
```

```sql
SELECT
    BOOL_OR(c_int) AS bool_or_int,
    BOOL_OR(c_float) AS bool_or_float,
    BOOL_OR(c_decimal) AS bool_or_decimal,
    BOOL_OR(c_bool) AS bool_or_bool
FROM test_numeric_or_null;
```
```text
+-------------+---------------+-----------------+--------------+
| bool_or_int | bool_or_float | bool_or_decimal | bool_or_bool |
+-------------+---------------+-----------------+--------------+
|           1 |             1 |               1 |         NULL |
+-------------+---------------+-----------------+--------------+
```

### Window function:
The following example partitions the rows based on the condition (id > 2), 
divides them into two groups, and displays the window aggregation results:
```sql
SELECT * FROM test_boolean_agg;
```
```text
+------+------+------+------+------+
| id   | c1   | c2   | c3   | c4   |
+------+------+------+------+------+
|    1 |    1 |    1 |    1 |    0 |
|    2 |    1 |    0 |    0 |    0 |
|    3 |    1 |    1 |    0 |    0 |
|    4 |    1 |    0 |    0 |    0 |
+------+------+------+------+------+
```
```sql
SELECT
    id,
    BOOLOR_AGG(c1) OVER (PARTITION BY (id > 2)) AS a,
    BOOLOR_AGG(c2) OVER (PARTITION BY (id > 2)) AS b,
    BOOLOR_AGG(c3) OVER (PARTITION BY (id > 2)) AS c,
    BOOLOR_AGG(c4) OVER (PARTITION BY (id > 2)) AS d
FROM test_boolean_agg
ORDER BY id;
```
```text
+------+------+------+------+------+
| id   | a    | b    | c    | d    |
+------+------+------+------+------+
|    1 |    1 |    1 |    1 |    0 |
|    2 |    1 |    1 |    1 |    0 |
|    3 |    1 |    1 |    0 |    0 |
|    4 |    1 |    1 |    0 |    0 |
+------+------+------+------+------+
```

### Error example:
```sql
SELECT BOOL_OR('invalid type');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = bool_or requires a boolean or numeric argument
```