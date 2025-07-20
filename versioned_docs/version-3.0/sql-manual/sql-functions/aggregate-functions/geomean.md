---
{
"title": "GEOMEAN",
"language": "en"
}
---

## Description

The `GEOMEAN` function calculates the geometric mean of a set of values in a specified column. The geometric mean is defined as the nth root of the product of n values, i.e., ($(x_1 \cdot x_2 \cdot \ldots \cdot x_n)^{1/n}$), where (n) is the count of values in the input. Our `GEOMEAN` function supports columns containing zero values (treating them as valid inputs) and `NULL` (automatically ignores NULL values), but it does not support negative values. If the input column contains negative values, it will return `NaN`.

## Syntax

```sql
GEOMEAN(<col>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<col>` | An expression (typically a column name) that specifies the values to be used for calculating the geometric mean. The values must be non-negative numbers (zero and NULL is allowed). |

## Return Value

- Returns a `NaN` representing the input column contains negative values.
- Returns a `NULL` representing the input column just has `NULL` values.
- Returns a `DOUBLE` representing the input column has some non-negative values (include zero).

## Example

**sql**

```sql
CREATE TABLE test_geomean_all (
    id INT,
    value DOUBLE
) DUPLICATE KEY (`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO test_geomean_all VALUES
    (1, 2.0),
    (1, 8.0),
    (2, 2.0),
    (2, NULL),
    (2, 8.0),
    (3, NULL),
    (4, -1.0),
    (5, -2.0),
    (5, -8.0),
    (6, -1.0),
    (6, 0.0),
    (7, 0.0),
    (7, -1.0);

SELECT id, GEOMEAN(value) AS geometric_mean
FROM test_geomean_all
GROUP BY id
ORDER BY id;
```

**Output**

```text
+------+----------------+
| id   | geometric_mean |
+------+----------------+
|    1 |              4 |
|    2 |              4 |
|    3 |           NULL |
|    4 |            NaN |
|    5 |            NaN |
|    6 |            NaN |
|    7 |            NaN |
+------+----------------+
```

**Explanation:**
- For id = 1: Values are [2.0, 8.0], the product is (2.0 * 8.0 = 16.0), so the geometric mean is $(16)^{1/2} = 4.0$.
- For id = 2: Values are [2.0, NULL, 8.0]. NULL is ignored, so the geometric mean is same as id = 1.
- For id = 3: Only NULL values exist, so the result is NULL.
- For id = 4, 5, the presence of negative numbers is not allowed—whether there's an even or odd number of negatives (even though -2.0 * -8.0 = 16.0).
- For id = 6, 7, the results demonstrate that when both 0.0 and negative values appear in the column—regardless of their order—the calculation remains prohibited.