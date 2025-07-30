---
{
"title": "GEOMEAN",
"language": "en"
}
---

## Description

The `GEOMEAN` function calculates the geometric mean of a set of values in a specified column. The geometric mean is defined as the nth root of the product of n values, i.e., $(x_1 \cdot x_2 \cdot \ldots \cdot x_n)^{1/n}$, where n is the number of input values. The GEOMEAN implementation in Doirs is designed to align with mathematical intuition, allowing for negative values and zeros in the column. Specific calculation rules are detailed in the return value section. NULL values are ignored during computation.

## Syntax

```sql
GEOMEAN(<col>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<col>` | An expression (typically a column name) that specifies the values to be used for calculating the geometric mean. The values must be non-negative numbers (zero and NULL is allowed). |

## Return Value

- If the input column contains a zero, returns 0.
- If the input column is empty, returns NULL.
- If the input column contains an even number of negative values, or an odd number of negative values with an odd number of elements in the computation, returns a normal DOUBLE value.
- If the input column contains an odd number of negative values with an even number of elements in the computation, an exception is thrown.

## Example

```sql
-- Create test table
CREATE TABLE test_geomean_new (
    id INT,
    value DOUBLE
) DUPLICATE KEY (`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

-- Example 1: Contains NULL, ignores NULL and computes normally
INSERT INTO test_geomean_new VALUES (1, 2.0), (1, NULL), (1, 8.0);
SELECT id, GEOMEAN(value) AS geometric_mean FROM test_geomean_new WHERE id = 1 GROUP BY id;
+------+----------------+
| id   | geometric_mean |
+------+----------------+
|    1 |              4 |
+------+----------------+

-- Example 2: Contains only NULL, returns NULL
INSERT INTO test_geomean_new VALUES (2, NULL);
SELECT id, GEOMEAN(value) AS geometric_mean FROM test_geomean_new WHERE id = 2 GROUP BY id;
+------+----------------+
| id   | geometric_mean |
+------+----------------+
|    2 |           NULL |
+------+----------------+

-- Example 3: Contains zero, returns 0
INSERT INTO test_geomean_new VALUES (3, 5.0), (3, 0.0);
SELECT id, GEOMEAN(value) AS geometric_mean FROM test_geomean_new WHERE id = 3 GROUP BY id;
+------+----------------+
| id   | geometric_mean |
+------+----------------+
|    3 |              0 |
+------+----------------+

-- Example 4: Even number of negative values, computes normally
INSERT INTO test_geomean_new VALUES (4, -2.0), (4, -8.0);
SELECT id, GEOMEAN(value) AS geometric_mean FROM test_geomean_new WHERE id = 4 GROUP BY id;
+------+----------------+
| id   | geometric_mean |
+------+----------------+
|    4 |              4 |
+------+----------------+

-- Example 5: Odd number of negative values with odd number of elements, computes normally
INSERT INTO test_geomean_new VALUES (5, -2.0), (5, 4.0), (5, 8.0);
SELECT id, GEOMEAN(value) AS geometric_mean FROM test_geomean_new WHERE id = 5 GROUP BY id;
+------+----------------+
| id   | geometric_mean |
+------+----------------+
|    5 |             -4 |
+------+----------------+

-- Example 6: Odd number of negative values with even number of elements, throws exception
INSERT INTO test_geomean_new VALUES (6, -2.0), (6, 4.0);
SELECT id, GEOMEAN(value) AS geometric_mean FROM test_geomean_new WHERE id = 6 GROUP BY id;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Geometric mean is undefined for odd number of negatives with even n
```