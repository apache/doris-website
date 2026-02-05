---
{
    "title": "CORR",
    "language": "en",
    "description": "Calculate the Pearson coefficient of two random variables."
}
---

## Description

Calculate the Pearson coefficient of two random variables.

## Syntax

```sql
CORR(<expr1>, <expr2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr1>` | Numeric expression (column) |
| `<expr2>` | Numeric expression (column) |

## Return Value

The return value is of type DOUBLE, the covariance of expr1 and expr2, except the product of the standard deviation of expr1 and expr2, special case:

- If the standard deviation of expr1 or expr2 is 0, 0 will be returned.
- If a column of expr1 or expr2 is NULL, the row data will not be counted in the final result.

## Example

```sql
select * from test_corr;
```

```text
+------+------+------+
| id   | k1   | k2   |
+------+------+------+
|    1 |   20 |   22 |
|    1 |   10 |   20 |
|    2 |   36 |   21 |
|    2 |   30 |   22 |
|    2 |   25 |   20 |
|    3 |   25 | NULL |
|    4 |   25 |   21 |
|    4 |   25 |   22 |
|    4 |   25 |   20 |
+------+------+------+
```

```sql
select id,corr(k1,k2) from test_corr group by id;
```

```text
+------+--------------------+
| id   | corr(k1, k2)       |
+------+--------------------+
|    4 |                  0 |
|    1 |                  1 |
|    3 |               NULL |
|    2 | 0.4539206495016019 |
+------+--------------------+
```
