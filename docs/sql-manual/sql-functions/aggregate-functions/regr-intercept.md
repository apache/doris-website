---
{
    "title": "REGR_INTERCEPT",
    "language": "en"
}
---

## Description

Returns the intercept of the univariate linear regression line for non-null pairs in a group. It is computed for non-null pairs using the following formula:

`AVG(y) - REGR_SLOPE(y, x) * AVG(x)`

Where `x` is the independent variable and y is the dependent variable.

## Syntax

```sql
REGR_INTERCEPT(<y>, <x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<y>` | The dependent variable. Supported type: Double. |
| `<x>` | The independent variable. Supported type: Double. |

## Return Value

Returns a Double value representing the intercept of the univariate linear regression line for non-null pairs in a group. If there are no rows, or only rows that contain nulls, the function returns NULL.

## Examples

```sql
-- Create sample table
CREATE TABLE test_regr_intercept (
  `id` int,
  `x` int,
  `y` int
) DUPLICATE KEY (`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

-- Insert sample data
INSERT INTO test_regr_intercept VALUES
(1, 18, 13),
(2, 14, 27),
(3, 12, 2),
(4, 5, 6),
(5, 10, 20);

-- Calculate the linear regression intercept of x and y
SELECT REGR_INTERCEPT(y, x) FROM test_regr_intercept;
```

```text
+----------------------+
| REGR_INTERCEPT(y, x) |
+----------------------+
|    5.512931034482759 |
+----------------------+
```

```sql
SELECT REGR_INTERCEPT(y, x) FROM test_regr_intercept where x>100;
```

When there are no rows in the group, the function returns `NULL`.

```text
+----------------------+
| REGR_INTERCEPT(y, x) |
+----------------------+
|                 NULL |
+----------------------+
```
