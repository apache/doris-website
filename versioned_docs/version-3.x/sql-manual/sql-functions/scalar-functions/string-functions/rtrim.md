---
{
    "title": "RTRIM",
    "language": "en",
    "description": "The RTRIM function is used to remove consecutive spaces or specified characters from the right side (trailing) of a string."
}
---

## Description

The RTRIM function is used to remove consecutive spaces or specified characters from the right side (trailing) of a string.

## Syntax

```sql
RTRIM( <str> [, <trim_chars> ] )
```

## Parameters

| Parameter      | Description                                                                                                                                                                                                                                                                      |
|----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<str>`        | The string that needs to be trimmed.                                                                                                                                                                                                                                             |
| `<trim_chars>` | Optional parameter. If this parameter is provided, the RTRIM function will remove all characters in `<trim_chars>` that appear on the right side of `<str>`. If this parameter is not provided, the RTRIM function will only remove the space characters on the right side of `<str>`. |

## Return Value

Returns a string with trailing spaces or `<trim_chars>` removed. Special cases:

- If any Parameter is NULL, NULL will be returned.


## Examples

```sql
SELECT rtrim('ab d   ') str;
```

```text
+------+
| str  |
+------+
| ab d |
+------+
```

```sql
SELECT rtrim('ababccaab','ab') str;
```

```text
+---------+
| str     |
+---------+
| ababcca |
+---------+
```
