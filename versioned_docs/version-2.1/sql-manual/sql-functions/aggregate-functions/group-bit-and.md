---
{
"title": "GROUP_BIT_AND",
"language": "en"
}
---

## Description

Performs a bitwise AND operation on all values in a single integer column or expression.

## Syntax

```sql
GROUP_BIT_AND(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | Supports all INT types |

## Return Value

Returns an integer value.

## Example

```sql
select * from group_bit;
```

```text
+-------+
| value |
+-------+
|     3 |
|     1 |
|     2 |
|     4 |
+-------+
```

```sql
select group_bit_and(value) from group_bit;
```

```text
+------------------------+
| group_bit_and(`value`) |
+------------------------+
|                      0 |
+------------------------+
```
