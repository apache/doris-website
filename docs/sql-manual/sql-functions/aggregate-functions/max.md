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
| `<expr>` | The expression to get the value. Supported types are String, Time, Date, DateTime, IPv4, IPv6, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal. |

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
