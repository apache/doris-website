---
{
    "title": "CORR_WELFORD",
    "language": "en"
}
---

## Description

Calculate the Pearson coefficient of two random variables using the [Welford](https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm) algorithm, which can effectively reduce calculation errors.

## Syntax

```sql
CORR_WELFORD(<expr1>, <expr2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr1>` | Double expression (column) |
| `<expr2>` | Double expression (column) |

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
select id,corr_welford(k1,k2) from test_corr group by id;
```

```text
+------+---------------------+
| id   | corr_welford(k1,k2) |
+------+---------------------+
|    2 |  0.4539206495016017 |
|    4 |                   0 |
|    3 |                NULL |
|    1 |                   1 |
+------+---------------------+
```
