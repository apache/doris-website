---
{
    "title": "URL_DECODE",
    "language": "en",
    "description": "Converts an url to a decode string."
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

Decoding a percent-encoded URL — `%3A` → `:`, `%2F` → `/`.

```sql
select url_decode('https%3A%2F%2Fdoris.apache.org%2Fzh-CN%2Fdocs%2Fsql-manual%2Fsql-functions%2Fstring-functions');
```

```text
+-------------------------------------------------------------------------------------------------------------+
| url_decode('https%3A%2F%2Fdoris.apache.org%2Fzh-CN%2Fdocs%2Fsql-manual%2Fsql-functions%2Fstring-functions') |
+-------------------------------------------------------------------------------------------------------------+
| https://doris.apache.org/zh-CN/docs/sql-manual/sql-functions/string-functions                               |
+-------------------------------------------------------------------------------------------------------------+
```

Decoding a `application/x-www-form-urlencoded`-style string — `+` → space, `%26` → `&`.

```sql
select url_decode('Doris+Q%26A');
```

```text
+---------------------------+
| url_decode('Doris+Q%26A') |
+---------------------------+
| Doris Q&A                 |
+---------------------------+
```
