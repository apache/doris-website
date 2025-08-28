---
{
    "title": "COVAR",
    "language": "en"
}
---

## Description

Calculates the sample covariance between two variables. If either input variable is NULL, that row is not included in the calculation.

## Alias

- COVAR_POP

## Syntax

```sql
COVAR(<expr1>, <expr2>)
COVAR_POP(<expr1>, <expr2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr1>` | One of the expressions to calculate, supported type is Double. |
| `<expr2>` | One of the expressions to calculate, supported type is Double. |

## Return Value

Returns the sample covariance of expr1 and expr2, with return type Double.
If there is no valid data in the group, returns NULL.

## Example

```sql
-- setup
create table baseall(
    id int,
    x double,
    y double
) distributed by hash(id) buckets 1
properties ("replication_num"="1");

insert into baseall values
    (1, 1.0, 2.0),
    (2, 2.0, 3.0),
    (3, 3.0, 4.0),
    (4, 4.0, NULL),
    (5, NULL, 5.0);
```

```sql
select covar(x,y) from baseall;
```

```text
+-------------------+
| covar(x,y)        |
+-------------------+
| 0.666666666666667 |
+-------------------+
```

```sql
select id, covar(x, y) from baseall group by id;
```

```text
+------+-------------+
| id   | covar(x, y) |
+------+-------------+
|    1 |           0 |
|    2 |           0 |
|    3 |           0 |
|    4 |        NULL |
|    5 |        NULL |
+------+-------------+
```
