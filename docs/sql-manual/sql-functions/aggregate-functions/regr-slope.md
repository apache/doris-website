---
{
    "title": "REGR_SLOPE",
    "language": "en",
    "description": "Returns the slope of the linear regression line for non-null pairs in a group."
}
---

## Description

Returns the slope of the linear regression line for non-null pairs in a group.


## Syntax

```sql
REGR_SLOPE(<y>, <x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<y>` | The dependent variable. Supported type: Double. |
| `<x>` | The independent variable. Supported type: Double. |

## Return Value

Returns a Double value representing the slope of the linear regression line.
If there are no rows in the group, or all rows contain NULLs for the expressions, the function returns `NULL`.

## Examples

```sql
-- setup
CREATE TABLE test_regr_slope (
  `id` int,
  `x` int,
  `y` int
) DUPLICATE KEY (`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

-- Insert example data
INSERT INTO test_regr_slope VALUES
(1, 18, 13),
(2, 14, 27),
(3, 12, 2),
(4, 5, 6),
(5, 10, 20);
```

```sql
SELECT REGR_SLOPE(y, x) FROM test_regr_slope;
```

Calculate the linear regression slope of x and y.


```text
+--------------------+
| REGR_SLOPE(y, x)   |
+--------------------+
| 0.6853448275862069 |
+--------------------+
```

```sql
SELECT REGR_SLOPE(y, x) FROM test_regr_slope where x>100;
```

When there are no rows in the group, the function returns `NULL`.

```text
+------------------+
| REGR_SLOPE(y, x) |
+------------------+
|             NULL |
+------------------+
```
