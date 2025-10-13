---
{
    "title": "NORMAL_CDF",
    "language": "en"
}
---

## Description

Computes the Cumulative distribution function (CDF) of the normal distribution at value `x`.

- Returns `NULL` when the standard deviation of the normal distribution is less than or equal to `0`.

## Syntax

```sql
NORMAL_CDF(<mean>, <sd>, <x>)
```

## Parameters  

| Parameter | Description |
| -- | -- |
| `<mean>` | The mean of the normal distribution |
| `<sd>` | The standard deviation of the normal distribution |
| `<x>` | The value to be evaluated |

## Return Value

Return the Cumulative distribution Function (CDF) for a Normal random variable at a value `x`.

- Return `NULL` when standard deviation of the normal distribution is less than or equal to `0`.

## Examples

```sql
select normal_cdf(10, 9, 10);
```

```text
+-----------------------------------------------------------------------+
| normal_cdf(cast(10 as DOUBLE), cast(9 as DOUBLE), cast(10 as DOUBLE)) |
+-----------------------------------------------------------------------+
|                                                                   0.5 |
+-----------------------------------------------------------------------+
```

```sql
select NORMAL_CDF(10, 0, 10);
```

```text
+-----------------------------------------------------------------------+
| normal_cdf(cast(10 as DOUBLE), cast(0 as DOUBLE), cast(10 as DOUBLE)) |
+-----------------------------------------------------------------------+
|                                                                  NULL |
+-----------------------------------------------------------------------+
```
