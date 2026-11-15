---
{
    "title": "MIN_BY",
    "language": "en",
    "description": "The MINBY function is used to return the corresponding associated value based on the minimum value of the specified column."
}
---

## Description

The MIN_BY function is used to return the corresponding associated value based on the minimum value of the specified column.

If multiple rows share the minimum `<expr2>`, `MIN_BY` returns `<expr1>` from one of those rows. Which row is selected is not guaranteed, and the result is not necessarily the smallest associated value. For a deterministic result, specify a tie-breaking rule, for example by filtering to the minimum `<expr2>` and applying `MIN` to `<expr1>`.

## Syntax

```sql
MIN_BY(<expr1>, <expr2>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<expr1>` | The expression used to specify the corresponding association. |
| `<expr2>` | The expression used to specify the minimum value for statistics. |

## Return Value

Returns the same data type as the input expression <expr1>.

## Example

```sql
select * from tbl;
```

```text
+------+------+------+------+
| k1   | k2   | k3   | k4   |
+------+------+------+------+
|    0 | 3    | 2    |  100 |
|    1 | 2    | 3    |    4 |
|    4 | 3    | 2    |    1 |
|    3 | 4    | 2    |    1 |
+------+------+------+------+
```

```sql
select min_by(k1, k4) from tbl;
```

One possible result follows; returning either `3` or `4` is valid for this example.

```text
+--------------------+
| min_by(`k1`, `k4`) |
+--------------------+
|                  4 |
+--------------------+ 
```

### Deterministic handling of tied minimum values

This self-contained example returns the smallest `k1` among rows with the minimum `k4`. Even though two rows have the minimum `k4 = 1`, the result is always `3`:

```sql
WITH data AS (
    SELECT 0 AS k1, 100 AS k4
    UNION ALL SELECT 1, 4
    UNION ALL SELECT 4, 1
    UNION ALL SELECT 3, 1
)
SELECT MIN(k1) AS min_k1
FROM data
WHERE k4 = (SELECT MIN(k4) FROM data);
```

```text
+--------+
| min_k1 |
+--------+
|      3 |
+--------+
```
