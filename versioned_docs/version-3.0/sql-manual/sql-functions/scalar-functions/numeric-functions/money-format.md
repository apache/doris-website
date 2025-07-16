---
{
    "title": "MONEY_FORMAT",
    "language": "en"
}
---

## Description

The number is output in currency format, the integer part is separated by commas every three bits, and the decimal part is reserved for two bits.

## Syntax

```sql
MONEY_FORMAT(<number>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<number>`   | The numbers to be formatted |

## Return value

Returns a string in currency format. Special cases:

- If the parameter is NULL, return NULL

## Example

```sql
select money_format(17014116);
```

```text
+------------------------+
| money_format(17014116) |
+------------------------+
| 17,014,116.00          |
+------------------------+
```

```sql
select money_format(1123.456);
```

```text
+------------------------+
| money_format(1123.456) |
+------------------------+
| 1,123.46               |
+------------------------+
```

```sql
select money_format(1123.4);
```

```text
+----------------------+
| money_format(1123.4) |
+----------------------+
| 1,123.40             |
+----------------------+
```