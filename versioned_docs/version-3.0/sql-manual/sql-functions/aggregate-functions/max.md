---
{
    "title": "MAX",
    "language": "en"
}
---

## Description

The MAX function returns the maximum value of the expression.

## Syntax

```sql
MAX(<expr>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `expr` | The expression needs to be obtained |

## Return Value

Returns the same data type as the input expression.

## Example

```sql
select max(scan_rows) from log_statis group by datetime;
```

```text
+------------------+
| max(`scan_rows`) |
+------------------+
|          4671587 |
+------------------+
```
