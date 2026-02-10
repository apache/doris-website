---
{
    "title": "REPEAT",
    "language": "en",
    "description": "The REPEAT function is used to repeat a string a specified number of times."
}
---

## Description

The REPEAT function is used to repeat a string a specified number of times.

## Syntax

```sql
REPEAT( <str>, <count> )
```

## Parameters

| Parameter | Description                                                                                                               |
|-----------|---------------------------------------------------------------------------------------------------------------------------|
| `<str>`   | The string to be repeated.                                                                                                |
| `<count>` | The number of times to repeat. It must be a non-negative integer. If it is less than 1, an empty string will be returned. |

## Return Value

Returns the string repeated the specified number of times. Special cases:

- If any Parameter is NULL, NULL will be returned.

## Examples

```sql
SELECT repeat("a", 3);
```

```text
+----------------+
| repeat('a', 3) |
+----------------+
| aaa            |
+----------------+
```

```sql
SELECT repeat("a", -1);
```

```text
+-----------------+
| repeat('a', -1) |
+-----------------+
|                 |
+-----------------+
```
