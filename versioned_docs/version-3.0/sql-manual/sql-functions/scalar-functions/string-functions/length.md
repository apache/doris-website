---
{
    "title": "LENGTH",
    "language": "en"
}
---

## Description

Returns the number of bytes in a string.

## Syntax

```sql
LENGTH ( <str> )
```

## Parameters

| Parameter | Description |
|-----------| --------------- |
| `<str>`   | The string whose bytes need to be calculated |

## Return Value

The number of bytes in the string `<str>`.

## Example

```sql
SELECT LENGTH("abc"),length("中国")
```

```text
+---------------+------------------+
| length('abc') | length('中国')   |
+---------------+------------------+
|             3 |                6 |
+---------------+------------------+
```