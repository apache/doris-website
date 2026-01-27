---
{
    "title": "HEX",
    "language": "en",
    "description": "If the input parameter is a number, return the string representation of the hexadecimal value."
}
---

## Description

If the input parameter is a number, return the string representation of the hexadecimal value.

If the input parameter is a string, convert each character to two hexadecimal characters, concatenate all the converted characters into a string for output.

## Syntax

```sql
HEX ( <str> )
```

## Parameters

| Parameter | Description |
|-------|--------------|
| `<str>` | Input parameter is a number or a string |

## Return value

The hexadecimal result of parameter `<str>`.

## Example

The input parameter is a number
```sql
SELECT HEX(12),HEX(-1)
```

```text
+---------+------------------+
| hex(12) | hex(-1)          |
+---------+------------------+
| C       | FFFFFFFFFFFFFFFF |
+---------+------------------+
```

The input parameter is a string

```sql
SELECT HEX('1'),HEX('@'),HEX('12')
```

```text
+----------+----------+-----------+
| hex('1') | hex('@') | hex('12') |
+----------+----------+-----------+
| 31       | 40       | 3132      |
+----------+----------+-----------+
```