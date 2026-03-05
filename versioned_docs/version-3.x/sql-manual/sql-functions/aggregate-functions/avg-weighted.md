---
{
    "title": "AVG_WEIGHTED",
    "language": "en",
    "description": "Calculates the weighted arithmetic mean, i.e., the result is the sum of the products of corresponding values and weights,"
}
---

## Description

Calculates the weighted arithmetic mean, i.e., the result is the sum of the products of corresponding values and weights, divided by the total sum of weights. If the total sum of weights is 0, it will return NaN.

## Syntax

```sql
AVG_WEIGHTED(<x>, <weight>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | It is the numeric expression for which the average needs to be calculated, and can be a column name, constant, or a complex numeric expression. |
| `<weight>` | It is a numeric expression, typically a column name, constant, or the result of another numeric calculation. |

## Return Value

The sum of the products of corresponding values and weights is accumulated, divided by the total sum of weights. If the total sum of weights equals 0, NaN will be returned.

## Example

```sql
select k1,k2 from test_doris_avg_weighted;
```

```text
+------+------+
| k1   | k2   |
+------+------+
|   10 |  100 |
|   20 |  200 |
|   30 |  300 |
|   40 |  400 |
+------+------+
```

```sql
select avg_weighted(k2,k1) from test_doris_avg_weighted;
```

```text
+--------------------------------------+
| avg_weighted(k2, cast(k1 as DOUBLE)) |
+--------------------------------------+
|                                  300 |
+--------------------------------------+
```
