---
{
    "title": "GROUP_BIT_OR",
    "language": "en",
    "description": "Performs a bitwise OR operation on all values in a single integer column or expression."
}
---

## Description

Performs a bitwise OR operation on all values in a single integer column or expression.

## Syntax

```sql
GROUP_BIT_OR(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | Supports all INT types |

## Return Value

Returns an integer value

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
mysql> select group_bit_or(value) from group_bit;
```

```text
+-----------------------+
| group_bit_or(`value`) |
+-----------------------+
|                     7 |
+-----------------------+
```
