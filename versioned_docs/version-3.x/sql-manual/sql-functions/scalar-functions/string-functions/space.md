---
{
    "title": "SPACE",
    "language": "en",
    "description": "Generate a string consisting of a specified number of spaces."
}
---

## Description

Generate a string consisting of a specified number of spaces.

## Syntax

```sql
SPACE ( <len> )
```

## Parameters

| Parameter | Description                      |
|-----------|----------------------------------|
| `<len>`   | The number of spaces to generate |

## Return Value

Returns a string consisting of the specified number of spaces. Special cases:

- If any Parameter is NULL, NULL will be returned.
- When `<len>` is less than 0, an empty string is returned.

## Examples

```sql
SELECT space(10);
```

```text
+------------+
| space(10)  |
+------------+
|            |
+------------+
```

```sql
SELECT space(null);
```

```text
+-------------+
| space(NULL) |
+-------------+
| NULL        |
+-------------+
```
