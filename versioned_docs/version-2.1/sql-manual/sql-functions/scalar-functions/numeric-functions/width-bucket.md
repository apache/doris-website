---
{
    "title": "WIDTH_BUCKET",
    "language": "en"
}
---

## Description

Construct an equal-width histogram, where the histogram range is divided into equal-sized intervals, and after calculation, return the bucket number where the value of the expression falls. Special cases:

- The function returns an integer value or NULL (if any input is NULL, it will return NULL)

## Syntax

```sql
WIDTH_BUCKET(<expr>, <min_value>, <max_value>, <num_buckets>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The expression for creating the histogram. This expression must evaluate to a numeric value or a value that can be implicitly converted to a numeric value. The value's range must be from `-(2^53 - 1)` to `2^53 - 1` (inclusive) |
| `<min_value>` | The lowest value point of the acceptable range for the expression. The parameter must be numeric and not equal to `<max_value>`. The range must be from `-(2^53 - 1)` to `2^53 - 1` (inclusive). Additionally, the difference between the highest and lowest value points must be less than `2^53` (for example: `abs(max_value - min_value) < 2^53)` |
| `<max_value>` | The highest value point of the acceptable range for the expression. The parameter must be numeric and not equal to `<min_value>`. The range must be from `-(2^53 - 1)` to `2^53 - 1` (inclusive). Additionally, the difference between the highest and lowest value points must be less than `2^53` (for example: `abs(max_value - min_value) < 2^53)` |
| `<num_buckets>` | The number of buckets. It must be a positive integer. The function assigns a value from the expression to each bucket and returns the corresponding bucket number |

## Return Value

Return the bucket number where the expression value falls. The function returns the following rules when the expression is out of range:

- If the value of the expression is less than `min_value`, return 0.
- If the value of the expression is greater than or equal to max_value, return `num_buckets + 1`.
- If any parameter is `null`, return `null`

## Example

```sql
DROP TABLE IF EXISTS width_bucket_test;

CREATE TABLE IF NOT EXISTS width_bucket_test (
`k1` int NULL COMMENT "",
`v1` date NULL COMMENT "",
`v2` double NULL COMMENT "",
`v3` bigint NULL COMMENT ""
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
DISTRIBUTED BY HASH(`k1`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1",
"storage_format" = "V2"
);

INSERT INTO width_bucket_test VALUES  
(1, "2022-11-18", 290000.00, 290000),
(2, "2023-11-18", 320000.00, 320000),
(3, "2024-11-18", 399999.99, 399999), 
(4, "2025-11-18", 400000.00, 400000), 
(5, "2026-11-18", 470000.00, 470000), 
(6, "2027-11-18", 510000.00, 510000), 
(7, "2028-11-18", 610000.00, 610000), 
(8, null, null, null);
```

```sql
SELECT * FROM width_bucket_test ORDER BY k1;                                      
```

```text
+------+------------+-----------+--------+
| k1   | v1         | v2        | v3     |
+------+------------+-----------+--------+
|    1 | 2022-11-18 |    290000 | 290000 |
|    2 | 2023-11-18 |    320000 | 320000 |
|    3 | 2024-11-18 | 399999.99 | 399999 |
|    4 | 2025-11-18 |    400000 | 400000 |
|    5 | 2026-11-18 |    470000 | 470000 |
|    6 | 2027-11-18 |    510000 | 510000 |
|    7 | 2028-11-18 |    610000 | 610000 |
|    8 | NULL       |      NULL |   NULL |
+------+------------+-----------+--------+
```

```sql
SELECT k1, v1, v2, v3, width_bucket(v1, date('2023-11-18'), date('2027-11-18'), 4) AS w FROM width_bucket_test ORDER BY k1;
```

```text
+------+------------+-----------+--------+------+
| k1   | v1         | v2        | v3     | w    |
+------+------------+-----------+--------+------+
|    1 | 2022-11-18 |    290000 | 290000 |    0 |
|    2 | 2023-11-18 |    320000 | 320000 |    1 |
|    3 | 2024-11-18 | 399999.99 | 399999 |    2 |
|    4 | 2025-11-18 |    400000 | 400000 |    3 |
|    5 | 2026-11-18 |    470000 | 470000 |    4 |
|    6 | 2027-11-18 |    510000 | 510000 |    5 |
|    7 | 2028-11-18 |    610000 | 610000 |    5 |
|    8 | NULL       |      NULL |   NULL | NULL |
+------+------------+-----------+--------+------+
```

```sql
SELECT k1, v1, v2, v3, width_bucket(v2, 200000, 600000, 4) AS w FROM width_bucket_test ORDER BY k1;
```

```text
+------+------------+-----------+--------+------+
| k1   | v1         | v2        | v3     | w    |
+------+------------+-----------+--------+------+
|    1 | 2022-11-18 |    290000 | 290000 |    1 |
|    2 | 2023-11-18 |    320000 | 320000 |    2 |
|    3 | 2024-11-18 | 399999.99 | 399999 |    2 |
|    4 | 2025-11-18 |    400000 | 400000 |    3 |
|    5 | 2026-11-18 |    470000 | 470000 |    3 |
|    6 | 2027-11-18 |    510000 | 510000 |    4 |
|    7 | 2028-11-18 |    610000 | 610000 |    5 |
|    8 | NULL       |      NULL |   NULL | NULL |
+------+------------+-----------+--------+------+
```

```sql
SELECT k1, v1, v2, v3, width_bucket(v3, 200000, 600000, 4) AS w FROM width_bucket_test ORDER BY k1;
```

```text
+------+------------+-----------+--------+------+
| k1   | v1         | v2        | v3     | w    |
+------+------------+-----------+--------+------+
|    1 | 2022-11-18 |    290000 | 290000 |    1 |
|    2 | 2023-11-18 |    320000 | 320000 |    2 |
|    3 | 2024-11-18 | 399999.99 | 399999 |    2 |
|    4 | 2025-11-18 |    400000 | 400000 |    3 |
|    5 | 2026-11-18 |    470000 | 470000 |    3 |
|    6 | 2027-11-18 |    510000 | 510000 |    4 |
|    7 | 2028-11-18 |    610000 | 610000 |    5 |
|    8 | NULL       |      NULL |   NULL | NULL |
+------+------------+-----------+--------+------+
```
