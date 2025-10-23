---
{
    "title": "REPLACE",
    "language": "en"
}
---

## Description

The REPLACE function is used to replace a part of characters in a string with other characters.

## Syntax

```sql
REPLACE ( <str>, <old>, <new> )
```

## Parameters

| Parameter      | Description                                                                                         |
|---------|-----------------------------------------------------------------------------------------------------|
| `<str>` | The string that needs to be replaced.                                                               |
| `<old>` | The substring that needs to be replaced. If `<old>` is not in `<str>`, no replacement will be made. |
| `<new>` | The new substring used to replace `<old>`.                                                            |

## Return Value

Returns the new string after replacing the substring. Special cases:

- If any Parameter is NULL, NULL will be returned.

## Examples

```sql
SELECT replace('hello world', 'world', 'universe');
```

```text
+---------------------------------------------+
| replace('hello world', 'world', 'universe') |
+---------------------------------------------+
| hello universe                              |
+---------------------------------------------+
```
