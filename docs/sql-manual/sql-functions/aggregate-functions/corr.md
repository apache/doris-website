---
{
    "title": "CORR",
    "language": "en",
    "description": "Calculates the Pearson correlation coefficient between two random variables."
}
---

## Description

Calculates the Pearson correlation coefficient between two random variables.

## Syntax

```sql
CORR(<expr1>, <expr2>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<expr1>` | Expression for calculation. Supported type is Double. |
| `<expr2>` | Expression for calculation. Supported type is Double. |

## Return Value

Returns a DOUBLE type value, which is the covariance of expr1 and expr2 divided by the product of their standard deviations. Special cases:

- If the standard deviation of expr1 or expr2 is 0, returns 0.
- If expr1 or expr2 contains NULL values, those rows are excluded from the calculation.
- If there is no valid data in the group, returns NULL.

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

```sql
select corr(k1,k2) from test_corr where id=999;
```

When the query result is empty, returns NULL.

```text
+-------------+
| corr(k1,k2) |
+-------------+
|        NULL |
+-------------+
```
