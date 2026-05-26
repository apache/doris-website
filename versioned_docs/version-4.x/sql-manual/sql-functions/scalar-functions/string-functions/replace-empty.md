---
{
    "title": "REPLACE_EMPTY",
    "language": "en",
    "description": "The REPLACE_EMPTY function is used to replace a part of characters in a string with other characters. Unlike the REPLACE function,"
}
---

## Description

The REPLACE_EMPTY function is used to replace a part of characters in a string with other characters. Unlike the [REPLACE](./replace.md) function, when `old` is an empty string, the `new` string is inserted before each character of the `str` string and at the end of the `str` string.

This function is mainly used to be compatible with Presto and Trino, and its behavior is exactly the same as the `REPLACE()` function in Presto and Trino. Supported since version 2.1.5.

## Syntax

```sql
REPLACE_EMPTY ( <str>, <old>, <new> )
```

## Parameters

| Parameter      | Description                                                                                                                                                                                                         |
|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<str>` | The string that needs to be replaced.                                                                                                                                                                               |
| `<old>` | The substring that needs to be replaced. If `<old>` is not in `<str>`, no replacement will be performed. If `<old>` is an empty string, the `<new>` string will be inserted before each character of the str string. |
| `<new>` | The new substring used to replace `<old>`.                                                                                                                                                                           |

## Return Value

Returns VARCHAR — the new string after replacing the substring. Special cases:

- If any parameter is NULL, returns NULL.
- If `<old>` is an empty string, returns the string with `<new>` inserted before every character of `<str>` and at the end.
- If `<old>` is not found in `<str>`, returns `<str>` unchanged.

## Examples

1. Basic usage: insert behavior when `<old>` is an empty string.

```sql
SELECT replace_empty('abc', '', 'x');
```

```text
+-------------------------------+
| replace_empty('abc', '', 'x') |
+-------------------------------+
| xaxbxcx                       |
+-------------------------------+
```

2. Plain substring replacement (same behavior as `REPLACE`).

```sql
SELECT replace_empty('hello', 'l', 'L');
```

```text
+----------------------------------+
| replace_empty('hello', 'l', 'L') |
+----------------------------------+
| heLLo                            |
+----------------------------------+
```

3. Empty `<str>` together with empty `<old>`.

```sql
SELECT replace_empty('', '', 'x');
```

```text
+----------------------------+
| replace_empty('', '', 'x') |
+----------------------------+
| x                          |
+----------------------------+
```

4. NULL propagation.

```sql
SELECT replace_empty(NULL, 'old', 'new');
```

```text
+-----------------------------------+
| replace_empty(NULL, 'old', 'new') |
+-----------------------------------+
| NULL                              |
+-----------------------------------+
```

5. Multi-byte (UTF-8) `<new>`.

```sql
SELECT replace_empty('hello', 'l', 'ṭṛìṭ');
```

```text
+--------------------------------------------+
| replace_empty('hello', 'l', 'ṭṛìṭ')        |
+--------------------------------------------+
| heṭṛìṭṭṛìṭo                                |
+--------------------------------------------+
```
