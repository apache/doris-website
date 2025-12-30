---
{
    "title": "QUOTE",
    "language": "en",
    "description": "The QUOTE function is used to wrap a string with single quotes and escape special characters within it, making it safe for use in SQL statements."
}
---

## Description

The QUOTE function is used to wrap a string with single quotes and escape special characters within it, making it safe for use in SQL statements.

## Syntax

```sql
QUOTE(<str>)
```

## Parameters

| Parameter | Description |
| ------- | ----------------------------------------- |
| `<str>` | The input string to be quoted. Type: VARCHAR |

## Return Value

Returns VARCHAR type, the string wrapped with single quotes and with special characters escaped.

Special cases:
- If input is NULL, returns the string 'NULL' (without quotes)
- Single quotes `'` are escaped to `\'`
- Backslashes `\` are escaped to `\\`
- `\\` is escaped to `\`
- Empty string returns `''`

## Examples

1. Basic string quoting
```sql
SELECT quote('hello');
```
```text
+----------------+
| quote('hello') |
+----------------+
| 'hello'        |
+----------------+
```

2. String with single quotes (will be escaped)
```sql
SELECT quote("It's a test");
```
```text
+----------------------+
| quote("It's a test") |
+----------------------+
| 'It's a test'        |
+----------------------+
```

3. NULL value handling
```sql
SELECT quote(NULL);
```
```text
+-------------+
| quote(NULL) |
+-------------+
| NULL        |
+-------------+
```

4. Empty string handling
```sql
SELECT quote('');
```
```text
+-----------+
| quote('') |
+-----------+
| ''        |
+-----------+
```

5. Backslash character
```sql
SELECT quote('aaa\\');
```
```text
+----------------+
| quote('aaa\\') |
+----------------+
| 'aaa\'         |
+----------------+
```

```sql
SELECT quote('aaa\cccb');
```
```text
+-------------------+
| quote('aaa\cccb') |
+-------------------+
| 'aaacccb'         |
+-------------------+
```