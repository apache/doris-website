---
{
    "title": "CORR_WELFORD",
    "language": "en",
    "description": "Calculates the Pearson correlation coefficient between two random variables using the Welford algorithm, which effectively reduces calculation errors."
}
---

## Description

Calculates the Pearson correlation coefficient between two random variables using the [Welford](https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm) algorithm, which effectively reduces calculation errors.

## Syntax

```sql
CORR_WELFORD(<expr1>, <expr2>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<expr1>` | Double expression (column) |
| `<expr2>` | Double expression (column) |

## Return Value

Returns a DOUBLE type value, which is the covariance of expr1 and expr2 divided by the product of their standard deviations. Special cases:

- If the standard deviation of expr1 or expr2 is 0, returns 0.
- If expr1 or expr2 contains NULL values, those rows are excluded from the final result.

## Example

```sql
-- setup
create table test_corr(
    id int,
    k1 double,
    k2 double
) distributed by hash (id) buckets 1
properties ("replication_num"="1");

insert into test_corr values 
    (1, 20, 22),
    (1, 10, 20),
    (2, 36, 21),
    (2, 30, 22),
    (2, 25, 20),
    (3, 25, NULL),
    (4, 25, 21),
    (4, 25, 22),
    (4, 25, 20);
```

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
