---
{
"title": "SEM",
"language": "en"
}
---

## Description

Calculate the standard error of the mean for all non-null values in the specified column or expression.

Let the sample value be $x_i$, the sample size be $n$, and the sample mean be $\bar{x}$:

$
\mathrm{SEM}=\sqrt{\frac{1}{n(n-1)}\sum_{i=1}^{n}\bigl(x_i-\bar{x}\bigr)^2}.
$

## Syntax

```text
SEM([DISTINCT] <expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | An expression or column, typically a numeric column or an expression that can be converted to a numeric value, supporting the Double data type.|
| `[DISTINCT]` | An optional keyword indicating that the mean standard error should be calculated after removing duplicate values in expr.。 |

## Return Value

Returns a Double. Returns the standard error of the mean for the selected column or expression. If all records within the group are NULL, the function returns NULL.

## Examples

```sql
-- setup
create table t1(
        id int,
        k_double double,
) distributed by hash (id) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 222.222),
    (2, 3.3),
    (3, 3.3),
    (4, null);
```

```sql
select sem(k_double) from t1;
```

Calculation of the Mean Standard Error for Double Type: The standard error of the mean for [222.222, 3.3, 3.3, null] is 72.974

```text
+---------------+
| sem(k_double) |
+---------------+
|        72.974 |
+---------------+
```

```sql
select sem(id) from t1
```

Calculation of the standard error of the mean for an int type: the standard error of the mean for [1, 2, 3, 4] is 0.645497.

```text
+--------------------+
| sem(id)            |
+--------------------+
| 0.6454972243679028 |
+--------------------+
```

```sql
select sem(cast(null as double)) from t1;
```

When all values are null, return null.

```text
+---------------------------+
| sem(cast(null as double)) |
+---------------------------+
|                      NULL |
+---------------------------+
```

```sql
select sem(distinct k_double) from t1;
```

Using the DISTINCT keyword for deduplication calculations, the mean standard error after removing duplicates [222.222, 3.3, 3.3, null] is 109.461.

```text
+------------------------+
| sem(distinct k_double) |
+------------------------+
|                109.461 |
+------------------------+
```
