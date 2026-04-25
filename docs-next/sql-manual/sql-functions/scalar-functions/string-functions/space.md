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

1. Generate specified number of spaces
```sql
SELECT space(5);
```
```text
+----------+
| space(5) |
+----------+
|          |
+----------+
```

2. Zero or negative number handling
```sql
SELECT space(0), space(-5);
```
```text
+----------+-----------+
| space(0) | space(-5) |
+----------+-----------+
|          |           |
+----------+-----------+
```

3. NULL value handling
```sql
SELECT space(NULL);
```
```text
+-------------+
| space(NULL) |
+-------------+
| NULL        |
+-------------+
```

4. Use with other functions
```sql
SELECT CONCAT('Hello', space(3), 'World');
```
```text
+------------------------------------+
| concat('Hello', space(3), 'World') |
+------------------------------------+
| Hello   World                      |
+------------------------------------+
```

### Keywords

    SPACE
