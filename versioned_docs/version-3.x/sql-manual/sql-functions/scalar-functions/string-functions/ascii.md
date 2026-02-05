---
{
    "title": "ASCII",
    "language": "en",
    "description": "Returns the ASCII code of the first character of a string"
}
---

## Description

Returns the ASCII code of the first character of a string

## Syntax

```sql
ASCII ( <str> )
```

## Parameters

| Parameter | Description |
|-----------|-------------------------|
| `<str>`   | The string whose ASCII code of the first character needs to be calculated |

## Return value

Parameter <str> ASCII code of the first character

## Example

```sql
SELECT ASCII('1'),ASCII('234')
```

```text
+------------+--------------+
| ascii('1') | ascii('234') |
+------------+--------------+
|         49 |           50 |
+------------+--------------+
```