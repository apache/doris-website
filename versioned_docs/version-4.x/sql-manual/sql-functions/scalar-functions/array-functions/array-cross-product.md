---
{
    "title": "ARRAY_CROSS_PRODUCT",
    "language": "en",
    "description": "Calculates the cross product of two three-dimensional numeric arrays."
}
---

## Description

Calculates the cross product of two three-dimensional numeric arrays.

For `lhs = [x1, x2, x3]` and `rhs = [y1, y2, y3]`, the result is:

`lhs x rhs = [x2 * y3 - x3 * y2, x3 * y1 - x1 * y3, x1 * y2 - x2 * y1]`

:::note
Since 4.1.2
:::

## Alias

- `cross_product`

## Syntax

```sql
array_cross_product(ARRAY<T> lhs, ARRAY<T> rhs)
```

## Parameters

| Parameter | Description |
|---|---|
| `lhs` | The first three-dimensional numeric array |
| `rhs` | The second three-dimensional numeric array |

`T` supports `FLOAT`, and integer array element types such as `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, and `LARGEINT`.

## Return Value

Returns `ARRAY<FLOAT>`.

- Returns `NULL` if any input array is `NULL`.
- Returns an error if any input array contains `NULL` elements.
- An error is returned if either input array does not contain exactly three elements.

## Examples

```sql
SELECT array_cross_product([2.5, -3.0, 4.25], [-7.5, 0.5, 1.25]);
```

```text
+--------------------------------------------------------------+
| array_cross_product([2.5, -3.0, 4.25], [-7.5, 0.5, 1.25])    |
+--------------------------------------------------------------+
| [-5.875, -35, -21.25]                                        |
+--------------------------------------------------------------+
```

```sql
SELECT array_cross_product(CAST([-128, 0, 127] AS ARRAY<TINYINT>),
                           CAST([3, -5, 7] AS ARRAY<TINYINT>));
```

```text
+---------------------------------------------------------------------------------------------------+
| array_cross_product(CAST([-128, 0, 127] AS ARRAY<TINYINT>), CAST([3, -5, 7] AS ARRAY<TINYINT>)) |
+---------------------------------------------------------------------------------------------------+
| [635, 1277, 640]                                                                                  |
+---------------------------------------------------------------------------------------------------+
```

```sql
SELECT array_cross_product(CAST(NULL AS ARRAY<FLOAT>), [4.0, 5.0, 6.0]);
```

```text
+--------------------------------------------------------------------------+
| array_cross_product(CAST(NULL AS ARRAY<FLOAT>), [4.0, 5.0, 6.0])         |
+--------------------------------------------------------------------------+
| NULL                                                                     |
+--------------------------------------------------------------------------+
```

```sql
SELECT array_cross_product([-11, NULL, 13], [17, -19, 23]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = function array_cross_product cannot have null
```
