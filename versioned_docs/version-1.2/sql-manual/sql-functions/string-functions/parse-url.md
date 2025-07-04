---
{
    "title": "PARSE_URL",
    "language": "en"
}
---

## parse_url
### description
#### Syntax

`VARCHAR  parse_url(VARCHAR url, VARCHAR  name)`


From the URL, the field corresponding to name is resolved. The name options are as follows: 'PROTOCOL', 'HOST', 'PATH', 'REF', 'AUTHORITY', 'FILE', 'USERINFO', 'PORT', 'QUERY', and the result is returned.

### example

```
mysql> SELECT parse_url ('https://doris.apache.org/', 'HOST');
+------------------------------------------------+
| parse_url('https://doris.apache.org/', 'HOST') |
+------------------------------------------------+
| doris.apache.org                               |
+------------------------------------------------+
```

If you want to get parameter in QUERY, you can use [extract_url_parameter](./extract-url-parameter.md).

### keywords
    PARSE URL
