---
{
    "title": "REGR_SLOPE",
    "language": "en",
    "description": "REGRSLOPE is used to calculate the slope of the least squares-fit linear equation for a set of number pairs."
}
---

## Description
REGR_SLOPE is used to calculate the slope of the least squares-fit linear equation for a set of number pairs.

## Syntax
```
REGR_SLOPE(y, x)
```

## Parameters
- `y` (Numeric): The dependent variable.
- `x` (Numeric): The independent variable.

Both `x` and `y` support basic numeric types.

## Returned values
Returned data type: FLOAT64

The function returns the slope of the linear regression line.

If there are no rows, or only rows with null values, the function returns NULL.

## Examples
```sql
-- Example 1: Basic Usage
SELECT regr_slope(y, x) FROM test;

-- Example 2: Usage in a query with sample data
SELECT * FROM test;
+------+------+------+
| id   | x    | y    |
+------+------+------+
|    1 |   18 |   13 |
|    3 |   12 |    2 |
|    5 |   10 |   20 |
|    2 |   14 |   27 |
|    4 |    5 |    6 |
+------+------+------+

SELECT regr_slope(y, x) FROM test;
+--------------------+
| regr_slope(y, x)   |
+--------------------+
| 0.6853448275862069 |
+--------------------+
```

## Usage notes
- This function ignores any pair where either value is null.
- In cases where the calculation would result in a division by zero, the function will return NULL.

## Related functions
REGR_INTERCEPT, REGR_R2, REGR_COUNT, REGR_AVGX, REGR_AVGY

## References
For more details about linear regression functions, please refer to the SQL standard documentation on aggregate functions.
