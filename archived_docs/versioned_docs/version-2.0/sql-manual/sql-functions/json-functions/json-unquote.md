---
{
    "title": "JSON_UNQUOTE",
    "language": "en"
}
---

## json_unquote
### Description
#### Syntax

`VARCHAR json_unquote(VARCHAR)`

This function unquotes a JSON value and returns the result as a utf8mb4 string. If the argument is NULL, it will return NULL.

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



### example

```
mysql> SELECT json_unquote('"doris"');
+-------------------------+
| json_unquote('"doris"') |
+-------------------------+
| doris                   |
+-------------------------+

mysql> SELECT json_unquote('[1, 2, 3]');
+---------------------------+
| json_unquote('[1, 2, 3]') |
+---------------------------+
| [1, 2, 3]                 |
+---------------------------+


mysql> SELECT json_unquote(null);
+--------------------+
| json_unquote(NULL) |
+--------------------+
| NULL               |
+--------------------+

mysql> SELECT json_unquote('"\\ttest"');
+--------------------------+
| json_unquote('"\ttest"') |
+--------------------------+
|       test                    |
+--------------------------+
```
### keywords
json,unquote,json_unquote
