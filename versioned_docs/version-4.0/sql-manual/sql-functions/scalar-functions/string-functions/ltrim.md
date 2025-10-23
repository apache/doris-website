---
{
    "title": "LTRIM",
    "language": "en"
}
---

## Description

The LTRIM function is used to remove consecutive spaces or specified characters from the left side (leading) of a string.

## Syntax

```sql
LTRIM( <str> [, <trim_chars> ] )
```

## Parameters

| Parameter      | Description                                                                                                                                                                                                                                                                           |
|----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<str>`        | String that need to be trimmed                                                                                                                                                                                                                                                        |
| `<trim_chars>` | Optional Parameter. If this parameter is provided, the LTRIM function will remove all characters from the `<trim_chars>` that appear on the left side of `<str>`. If this parameter is not provided, the LTRIM function will only remove the space character to the left of `'<str>'`. |

## Return Value

Returns a string with leading spaces or `<trim_chars>` removed. Special cases:

- If any Parameter is NULL, NULL will be returned.

## Examples

```sql
SELECT ltrim('   ab d') str;
```

```text
+------+
| str  |
+------+
| ab d |
+------+
```

```sql
SELECT ltrim('ababccaab','ab') str;
```

```text
+-------+
| str   |
+-------+
| ccaab |
+-------+
```
