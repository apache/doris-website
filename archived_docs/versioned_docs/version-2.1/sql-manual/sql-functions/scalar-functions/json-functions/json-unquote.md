---
{
    "title": "JSON_UNQUOTE",
    "language": "en",
    "description": "This function unquotes a JSON value and returns the result as a utf8mb4 string. If the argument is NULL, it will return NULL."
}
---

## Description
This function unquotes a JSON value and returns the result as a utf8mb4 string. If the argument is NULL, it will return NULL.

## Syntax
```sql
JSON_UNQUOTE (<a>)
```
## Parameters
| Parameters | Description                                                    |
|------|-------------------------------------------------------|
| `<a>` | The element to be unquoted. |

## Return Values

Returns a utf8mb4 string. Special cases are as follows:
* If the passed parameter is NULL, return NULL.
* If the passed parameter is not a value with double quotes, the value itself will be returned.
* If the passed parameter is not a string, it will be automatically converted to a string and then the value itself will be returned.

Escape sequences within a string as shown in the following table will be recognized. Backslashes will be ignored for all other escape sequences.

| Escape Sequence | Character Represented by Sequence  |
|-----------------|------------------------------------|
| \"              | A double quote (") character       |
| \b              | A backspace character              |
| \f              | A formfeed character               |
| \n              | A newline (linefeed) character     |
| \r              | A carriage return character        |
| \t              | A tab character                    |
| \\              | A backslash (\) character          |
| \uxxxx          | UTF-8 bytes for Unicode value XXXX |


### Examples

```sql
SELECT json_unquote('"doris"');
```

```text
+-------------------------+
| json_unquote('"doris"') |
+-------------------------+
| doris                   |
+-------------------------+
```
```sql
SELECT json_unquote('[1, 2, 3]');
```
```text
+---------------------------+
| json_unquote('[1, 2, 3]') |
+---------------------------+
| [1, 2, 3]                 |
+---------------------------+
```
```sql
SELECT json_unquote(null);
```
```text
+--------------------+
| json_unquote(NULL) |
+--------------------+
| NULL               |
+--------------------+
```
```sql
SELECT json_unquote('"\\ttest"');
```
```text
+--------------------------+
| json_unquote('"\ttest"') |
+--------------------------+
|       test                    |
+--------------------------+
```
```sql
select json_unquote('"doris');
```
```text
+------------------------+
| json_unquote('"doris') |
+------------------------+
| "doris                 |
+------------------------+
```
```sql
select json_unquote('doris');
```
```text
+-----------------------+
| json_unquote('doris') |
+-----------------------+
| doris                 |
+-----------------------+
```
```sql
select json_unquote(1);
```
```text
+-----------------------------------------+
| json_unquote(cast(1 as VARCHAR(65533))) |
+-----------------------------------------+
| 1                                       |
+-----------------------------------------+
```
