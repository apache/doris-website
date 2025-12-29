---
{
    "title": "FIELD",
    "language": "en",
    "description": "Returns the position of the first occurrence of <expr> in the list of values <param> [, ...]. If <expr> is not found, the function returns 0."
}
---

## Description

Returns the position of the first occurrence of `<expr>` in the list of values `<param> [, ...]`.  
If `<expr>` is not found, the function returns `0`. This function is commonly used in `ORDER BY` to implement custom sorting.

## Syntax

```sql
FIELD(<expr>, <param> [, ...])
```

## Parameters

| Parameter  | Description                                             |
|------------|---------------------------------------------------------|
| `<expr>`   | The value to be searched in the list of parameters.     |
| `<param>`  | A sequence of values to compare against `<expr>`.       |

## Return Value

- Returns the position (1-based index) of `<expr>` in the list of `<param>` values.  
- If `<expr>` is not found, returns `0`.  
- If `<expr>` is `NULL`, returns `0`.

## Examples

```sql
SELECT FIELD(2, 3, 1, 2, 5);
```

```text
+----------------------+
| FIELD(2, 3, 1, 2, 5) |
+----------------------+
|                    3 |
+----------------------+
```

```sql
SELECT k1, k7 FROM baseall WHERE k1 IN (1,2,3) ORDER BY FIELD(k1, 2, 1, 3);
```

```text
+------+------------+
| k1   | k7         |
+------+------------+
|    2 | wangyu14   |
|    1 | wangjing04 |
|    3 | yuanyuan06 |
+------+------------+
```

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry');
```

```text
+------------+
| class_name |
+------------+
| Suzi       |
| Suzi       |
| Ben        |
| Ben        |
| Henry      |
| Henry      |
+------------+
```