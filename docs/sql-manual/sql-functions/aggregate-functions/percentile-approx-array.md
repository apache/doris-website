---
{
    "title": "PERCENTILE_APPROX_ARRAY",
    "language": "en",
    "description": "PERCENTILE_APPROX_ARRAY calculates multiple approximate percentiles in one aggregation using a shared T-Digest state."
}
---

## Description

`PERCENTILE_APPROX_ARRAY` calculates multiple approximate percentiles in one aggregation. It builds one T-Digest for the input values and evaluates every requested percentile from that shared state, which is more efficient than calling `PERCENTILE_APPROX` separately for each percentile.

:::note
This function is supported since 4.2.0.
:::

## Syntax

```sql
PERCENTILE_APPROX_ARRAY(<col>, <quantiles> [, <compression>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<col>` | The numeric expression whose percentiles are calculated. Values are converted to `DOUBLE`. `NULL` values are ignored. |
| `<quantiles>` | A constant `ARRAY<DOUBLE>`. Each element must be finite, non-NULL, and in `[0.0, 1.0]`. Results follow the same order as the array, and duplicate levels are preserved. An empty array is allowed. |
| `<compression>` | Optional constant `DOUBLE` in `[2048, 10000]`. A larger value generally improves accuracy but uses more memory. The default is `10000`; non-finite values and values outside the valid range also use `10000`. |

## Return Value

Returns an `ARRAY<DOUBLE>` containing one approximate percentile for each element of `<quantiles>`. The function returns an empty array when `<quantiles>` is empty or when the group contains no non-NULL input values. Invalid percentile levels and NULL elements in `<quantiles>` produce an error.

## Example

```sql
CREATE TABLE percentile_approx_array_example (
    id INT,
    value DOUBLE NULL
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO percentile_approx_array_example VALUES
    (1, 1.0), (2, 2.0), (3, 3.0), (4, NULL),
    (5, 10.0), (6, 20.0), (7, 30.0), (8, 100.0);
```

Calculate several approximate percentiles with the default compression:

```sql
SELECT percentile_approx_array(value, [0.0, 0.25, 0.5, 0.75, 1.0]) AS percentiles
FROM percentile_approx_array_example;
```

```text
+--------------------------+
| percentiles              |
+--------------------------+
| [1, 2.25, 10, 27.5, 100] |
+--------------------------+
```

Specify the compression explicitly:

```sql
SELECT percentile_approx_array(value, [0.25, 0.5, 0.75], 2048) AS percentiles
FROM percentile_approx_array_example;
```

```text
+------------------+
| percentiles      |
+------------------+
| [2.25, 10, 27.5] |
+------------------+
```

All-NULL input returns an empty array:

```sql
SELECT percentile_approx_array(CAST(NULL AS DOUBLE), [0.0, 0.5, 1.0]) AS percentiles
FROM percentile_approx_array_example;
```

```text
+-------------+
| percentiles |
+-------------+
| []          |
+-------------+
```

An empty percentile array also returns an empty array:

```sql
SELECT percentile_approx_array(value, []) AS percentiles
FROM percentile_approx_array_example;
```

```text
+-------------+
| percentiles |
+-------------+
| []          |
+-------------+
```
