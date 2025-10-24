---
{
    "title": "LENGTH",
    "language": "en"
}
---

## Description

Returns the number of bytes in a string or a binary string.

## Syntax

```sql
LENGTH ( <str> )
```

## Parameters

| Parameter | Description |
|-----------| --------------- |
| `<str>`   | The string or binary string whose bytes need to be calculated |

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