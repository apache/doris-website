---
{
    "title": "MAX_BY",
    "language": "en",
    "description": "The MAXBY function is used to return the corresponding associated value based on the maximum value of the specified column."
}
---

## Description

The MAX_BY function is used to return the corresponding associated value based on the maximum value of the specified column.

## Syntax

```sql
MAX_BY(<expr1>, <expr2>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<expr1>` | The expression used to specify the corresponding association. |
| `<expr2>` | The expression used to specify the maximum value for statistics. |

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
select max_by(k1, k4) from tbl;
```

```text
+--------------------+
| max_by(`k1`, `k4`) |
+--------------------+
|                  0 |
+--------------------+ 
```
