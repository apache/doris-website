---
{
    "title": "LENGTH",
    "language": "en"
}
---

## Description

Returns the number of bytes in a binary string.

## Syntax

```sql
LENGTH ( <bin> )
```

## Parameters

| Parameter | Description |
|-----------| --------------- |
| `<bin>`   | The binary string whose bytes need to be calculated |

## Return Value

The number of bytes in the binary string `<bin>`.

## Example

```sql
SELECT length(x'34AAA'), length(x'34AAA');
```

```text
+------------------+------------------+
| length(x'34AAA') | length(x'34AAA') |
+------------------+------------------+
|                3 |                3 |
+------------------+------------------+
```
