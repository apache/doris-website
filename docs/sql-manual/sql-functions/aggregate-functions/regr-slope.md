---
{
    "title": "REGR_SLOPE",
    "language": "en"
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
| `<y>` | The dependent variable. This must be an expression that can be evaluated to a numeric type. |
| `<x>` | The independent variable. This must be an expression that can be evaluated to a numeric type. |

## Return Value

Returns a `DOUBLE` value representing the slope of the linear regression line.

## Examples

```sql
-- Create example table
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

-- Calculate the linear regression slope of x and y
SELECT REGR_SLOPE(y, x) FROM test_regr_slope;
```

```text
+----------------------+
| regr_slope(y, x)     |
+----------------------+
| 0.6853448275862069   |
+----------------------+
```
