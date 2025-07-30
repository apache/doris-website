---
{
    "title": "URL_DECODE",
    "language": "en"
}
---

## Description

Converts an url to a decode string.

## Syntax

```sql
URL_DECODE( <str> )
```

## Required Parameters
| Parameters | Description |
|------|------|
| `<str>` | the string to decode. If url is not a string type. |

##  Return Value

The decoded value

##  Example

```sql
select url_decode('https%3A%2F%2Fdoris.apache.org%2Fzh-CN%2Fdocs%2Fsql-manual%2Fsql-functions%2Fstring-functions');
```
```sql
+------------------------------------------------+
| url_decode('https%3A%2F%2Fdoris.apache.org%2Fzh-CN%2Fdocs%2Fsql-manual%2Fsql-functions%2Fstring-functions') |
+------------------------------------------------+
| https://doris.apache.org/zh-CN/docs/sql-manual/sql-functions/string-functions                               |
+------------------------------------------------+
```
