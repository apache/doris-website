---
{
    "title": "REGR_R2",
    "language": "en",
    "description": "Returns the coefficient of determination of the linear regression for non-null pairs in a group."
}
---

## Description

Returns the coefficient of determination of the linear regression computed over non-null `(y, x)` pairs in a group, where `x` is the independent variable and `y` is the dependent variable.

## Syntax

```sql
REGR_R2(<y>, <x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<y>` | The dependent variable. Supported type: Double. |
| `<x>` | The independent variable. Supported type: Double. |

## Return Value

Returns a Double value representing the coefficient of determination (R-squared).
- If `REGR_COUNT(y, x) < 1`, the function returns `NULL`.
- If `VAR_POP(x) = 0`, the function returns `NULL`.
- If `VAR_POP(y) = 0`, the function returns `1`.
- Otherwise, the function returns `POWER(CORR(y, x), 2)`.

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
(2, 5, NULL),
(3, 1, 5),
(3, 1, 7),
(4, 1, 5),
(4, 2, 5);
```

```sql
SELECT id, REGR_R2(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+---------------------+
| id   | REGR_R2(y, x)       |
+------+---------------------+
|    1 |                NULL |
|    2 |                 1.0 |
|    3 |                NULL |
|    4 |                 1.0 |
+------+---------------------+
```

Group 3 shows the `VAR_POP(x) = 0` case, so the result is `NULL`, and group 4 shows the `VAR_POP(y) = 0` case, so the result is `1.0`.
