---
{
    "title": "BOOL_XOR",
    "language": "en",
    "description": "Performs a logical XOR aggregation over all non-NULL values of the expression."
}
---

## Description

Performs a logical XOR aggregation over all non-NULL values of the expression.

## Alias

- BOOLXOR_AGG

## Syntax

```text
BOOL_XOR(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | Expression to be aggregated with logical XOR. Supports BOOLEAN type and numeric types that can be converted to boolean by the 0/non-0 rule (0 is FALSE, non-0 is TRUE). |

## Return Value

The return value is BOOLEAN. It returns TRUE when there is only one TRUE among all non-NULL values, otherwise it returns FALSE.

If all values of the expression are NULL or the expression is empty, the function returns NULL.

## Examples

Initialize table:
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

### Aggregate function

```sql
SELECT BOOLXOR_AGG(c1), BOOLXOR_AGG(c2), BOOLXOR_AGG(c3), BOOLXOR_AGG(c4)
FROM test_boolean_agg;
```
```text
+-----------------+-----------------+-----------------+-----------------+
| BOOLXOR_AGG(c1) | BOOLXOR_AGG(c2) | BOOLXOR_AGG(c3) | BOOLXOR_AGG(c4) |
+-----------------+-----------------+-----------------+-----------------+
|               0 |               0 |               1 |               0 |
+-----------------+-----------------+-----------------+-----------------+
```

BOOL_XOR also accepts numeric types; non-zero values are treated as TRUE:
```sql
CREATE TABLE test_numeric_and_null (
    id INT,
    c_int INT,
    c_float FLOAT,
    c_decimal DECIMAL(10,2),
    c_bool BOOLEAN
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test_numeric_and_null (id, c_int, c_float, c_decimal, c_bool) VALUES
(1, 1, 1.0, NULL, NULL),
(2, 0, NULL, 0.00, NULL),
(3, 1, 3.14, 1.00, NULL),
(4, 0, 1.0, 0.00, NULL),
(5, NULL, NULL, NULL, NULL);
```

```sql
SELECT
    BOOL_XOR(c_int) AS bool_xor_int,
    BOOL_XOR(c_float) AS bool_xor_float,
    BOOL_XOR(c_decimal) AS bool_xor_decimal,
    BOOL_XOR(c_bool) AS bool_xor_bool
FROM test_numeric_and_null;
```
```text
+--------------+----------------+------------------+---------------+
| bool_xor_int | bool_xor_float | bool_xor_decimal | bool_xor_bool |
+--------------+----------------+------------------+---------------+
|            0 |              0 |                1 |          NULL |
+--------------+----------------+------------------+---------------+
```

### Window function
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
    BOOLXOR_AGG(c1) OVER (PARTITION BY (id > 2)) AS a,
    BOOLXOR_AGG(c2) OVER (PARTITION BY (id > 2)) AS b,
    BOOLXOR_AGG(c3) OVER (PARTITION BY (id > 2)) AS c,
    BOOLXOR_AGG(c4) OVER (PARTITION BY (id > 2)) AS d
FROM test_boolean_agg
ORDER BY id;
```
```text
+------+------+------+------+------+
| id   | a    | b    | c    | d    |
+------+------+------+------+------+
|    1 |    0 |    1 |    1 |    0 |
|    2 |    0 |    1 |    1 |    0 |
|    3 |    0 |    1 |    0 |    0 |
|    4 |    0 |    1 |    0 |    0 |
+------+------+------+------+------+
```

### Error example:
```sql
SELECT BOOL_XOR('invalid type');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = bool_xor requires a boolean or numeric argument
``` 