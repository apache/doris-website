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
| `<y>` | The dependent variable. This must be an expression that can be evaluated to a numeric type. |
| `<x>` | The independent variable. This must be an expression that can be evaluated to a numeric type. |

## Return Value

Return a `DOUBLE` value, representing the intercept of the univariate linear regression line for non-null pairs in a group.

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
+-------------------------+
| regr_intercept(y, x)    |
+-------------------------+
|      5.512931034482759  | 
+-------------------------+
```