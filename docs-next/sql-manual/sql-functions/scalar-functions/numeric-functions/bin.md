---
{
    "title": "BIN",
    "language": "en",
    "description": "Converts decimal numbers to binary text."
}
---

## Description

Converts decimal numbers to binary text.

## Syntax

```sql
BIN(<a>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<a>` | Decimal value to be converted (type: BigInt) |

## Return Value

The binary representation of the parameter `<a>`. When `<a>` is negative, the result is its 64-bit complement.
When `a` is NULL, returns NULL.

## Examples

```sql
select bin(0);
```

```text
+--------+
| bin(0) |
+--------+
| 0      |
+--------+
```

```sql
select bin(-1);
```

```text
+------------------------------------------------------------------+
| bin(-1)                                                          |
+------------------------------------------------------------------+
| 1111111111111111111111111111111111111111111111111111111111111111 |
+------------------------------------------------------------------+
```

```sql
select bin(123);
```

```text
+----------+
| bin(123) |
+----------+
| 1111011  |
+----------+
```

```sql
select bin(NULL);
```

```text
+-----------+
| bin(NULL) |
+-----------+
| NULL      |
+-----------+
```
