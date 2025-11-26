---
{
    "title": "FORMAT",
    "language": "en"
}
---

## Description

The FORMAT function returns a string formatted using the specified format string and parameters. The formatting rules follow the [fmt format specification](https://fmt.dev/11.1/syntax/#format-specification-mini-language).

## Syntax

```sql
FORMAT(<format>, <args>[, ...])
```

## Parameters

| Parameter | Description |
| ---------- | ----------------------------------------- |
| `<format>` | Format string containing format placeholders. Type: VARCHAR |
| `<args>` | Parameters to be formatted (can be multiple). Type: ANY |

## Return Value

Returns VARCHAR type, representing the result formatted according to the format string.

Special cases:
- If any parameter is NULL, returns NULL
- Format string uses `{}` as placeholder
- Supports positional parameters (e.g., `{0}`, `{1}`) and named parameters
- Supports various format options (alignment, precision, padding, etc.)

## Examples

1. Basic usage: Format number precision
```sql
SELECT format('{:.2}', pi());
```
```text
+-----------------------+
| format('{:.2}', pi()) |
+-----------------------+
| 3.1                   |
+-----------------------+
```

2. Multiple parameter formatting
```sql
SELECT format('{0}-{1}', 'hello', 'world');
```
```text
+-------------------------------------+
| format('{0}-{1}', 'hello', 'world') |
+-------------------------------------+
| hello-world                         |
+-------------------------------------+
```

3. Alignment and padding
```sql
SELECT format('{:>10}', 123);
```
```text
+-----------------------+
| format('{:>10}', 123) |
+-----------------------+
|        123            |
+-----------------------+
```

4. NULL value handling
```sql
SELECT format('{:.2}', NULL);
```
```text
+-----------------------+
| format('{:.2}', NULL) |
+-----------------------+
| NULL                  |
+-----------------------+
```

5. UTF-8 string handling
```sql
SELECT format('{0}-{1}', 'ṭṛṭṛ', 'ṭṛ');
```
```text
+---------------------------------------------+
| format('{0}-{1}', 'ṭṛṭṛ', 'ṭṛ')             |
+---------------------------------------------+
| ṭṛṭṛ-ṭṛ                                     |
+---------------------------------------------+
```
