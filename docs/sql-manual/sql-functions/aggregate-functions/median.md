---
{
    "title": "MEDIAN",
    "language": "en"
}
---

## Description

The MEDIAN function returns the median of the expression.

## Syntax

```sql
MEDIAN(<expr>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<expr>` | The expression needs to be obtained |

## Return Value

Returns the same data type as the input expression.

## Example

```sql
select median(scan_rows) from log_statis group by datetime;
```

```text
+---------------------+
| median(`scan_rows`) |
+---------------------+
|                 50 |
+---------------------+
```