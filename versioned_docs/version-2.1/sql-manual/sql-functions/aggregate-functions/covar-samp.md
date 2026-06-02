---
{
    "title": "COVAR_SAMP",
    "language": "en",
    "description": "Computes the sample covariance between two numeric variables."
}
---

## Description

Computes the sample covariance between two numeric variables.

## Syntax

```sql
COVAR_SAMP(<expr1>, <expr2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr1>` | Numeric expression or column |
| `<expr2>` | Numeric expression or column |

## Return Value

Returns the sample covariance of expr1 and expr2, special case:

- If a column of expr1 or expr2 is NULL, the row data will not be counted in the final result.

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

```
select covar_samp(x,y) from baseall;
```

```text
+---------------------+
| covar_samp(x, y)    |
+---------------------+
| 0.89442719099991586 |
+---------------------+
```
