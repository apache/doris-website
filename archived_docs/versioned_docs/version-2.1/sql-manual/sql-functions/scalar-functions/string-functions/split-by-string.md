---
{
    "title": "SPLIT_BY_STRING",
    "language": "en",
    "description": "Split the input string into a string array according to the specified string."
}
---

## Description

Split the input string into a string array according to the specified string.

## Syntax

```sql
SPLIT_BY_STRING ( <str>, <separator> )
```

## Parameters

| Parameter     | Description                    |
|---------------|--------------------------------|
| `<str>`       | The string to be split.        |
| `<separator>` | The string used for splitting. |

## Return Value

Returns a string array split according to the specified string. Special cases:

- If any of the parameters is NULL, NULL is returned.
- When `<separator>` is an empty string, `<str>` will be split to byte sequence.

## Examples

```sql
SELECT split_by_string('hello','l');
```

```text
+-------------------------------+
| split_by_string('hello', 'l') |
+-------------------------------+
| ["he", "", "o"]               |
+-------------------------------+
```

```sql
SELECT split_by_string('hello','');
```

```text
+------------------------------+
| split_by_string('hello', '') |
+------------------------------+
| ["h", "e", "l", "l", "o"]    |
+------------------------------+
```
