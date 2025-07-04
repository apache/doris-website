---
{
    "title": "MIN",
    "language": "en"
}
---

## Description

The MIN function returns the minimum value of the expression.

## Syntax

```sql
MIN(expr)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<expr>` | The expression needs to be obtained |

## Return Value

Returns the same data type as the input expression.

## Example

```sql
select MIN(scan_rows) from log_statis group by datetime;
```

```text
+------------------+
| MIN(`scan_rows`) |
+------------------+
|                0 |
+------------------+
```
