---
{
    "title": "REGR_SXX",
    "language": "en",
    "description": "Returns the sum of squares of the independent variable (x) for non-null pairs in a group."
}
---

## Description

Returns the sum of squared deviations of the independent variable `x` from its mean, computed over non-null `(y, x)` pairs in a group, where `x` is the independent variable and `y` is the dependent variable. It is equivalent to `REGR_COUNT(y, x) * VAR_POP(x)`.

## Syntax

```sql
REGR_SXX(<y>, <x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<y>` | The dependent variable. Supported type: Double. |
| `<x>` | The independent variable. Supported type: Double. |

## Return Value

Returns a Double value representing the sum of squared deviations of `x` from its mean.
If there are no rows in the group, or all rows contain NULLs for the expressions, the function returns `NULL`.

## Example

```sql
CREATE TABLE test_regr (
  `id` int,
  `x` double,
  `y` double
) DUPLICATE KEY (`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO test_regr VALUES
(1, 0, NULL),
(2, 1, 3),
(2, 2, 5),
(2, 3, 7),
(2, 4, 9),
(2, 5, NULL);
```

```sql
SELECT id, REGR_SXX(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+--------------------+
| id   | REGR_SXX(y, x)     |
+------+--------------------+
|    1 |               NULL |
|    2 |                5.0 |
+------+--------------------+
```
