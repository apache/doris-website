---
{
    "title": "KURT,KURT_POP,KURTOSIS",
    "language": "en"
}
---

## Description

The KURTOSIS function returns the [kurtosis](https://en.wikipedia.org/wiki/Kurtosis) of the expr expression.
The forumula used for this function is `4-th centrol moment / ((variance)^2) - 3`.

## Alias

KURT_POP,KURTOSIS

## Syntax

```sql
KURTOSIS(<expr>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<expr>` | The expression needs to be obtained |

## Return Value

Returns a value of type DOUBLE. Special cases:
- Returns NULL when the variance is zero.

## Example

```sql
select * from statistic_test;
```

```text
+-----+------+------+
| tag | val1 | val2 |
+-----+------+------+
|   1 |  -10 |   -10|
|   2 |  -20 |  NULL|
|   3 |  100 |  NULL|
|   4 |  100 |  NULL|
|   5 | 1000 |  1000|
+-----+------+------+
```

```sql
select kurt(val1), kurt(val2) from statistic_test;
```

```text
+-------------------+--------------------+
| kurt(val1)        | kurt(val2)         |
+-------------------+--------------------+
| 0.162124583734851 | -1.3330994719286338 |
+-------------------+--------------------+
```

```sql
// Each group just has one row, result is NULL
select kurt(val1), kurt(val2) from statistic_test group by tag;
```

```text
+------------+------------+
| kurt(val1) | kurt(val2) |
+------------+------------+
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
+------------+------------+
```

