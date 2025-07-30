---
{
"title": "EXTRACT_URL_PARAMETER",
"language": "en"
}
---

## extract_url_parameter
### description
#### Syntax

`VARCHAR  extract_url_parameter(VARCHAR url, VARCHAR  name)`


Returns the value of the "name" parameter in the URL, if present. Otherwise an empty string.
If there are many parameters with this name, the first occurrence is returned.
This function works assuming that the parameter name is encoded in the URL exactly as it was in the passed parameter.

```
mysql> SELECT extract_url_parameter ("http://doris.apache.org?k1=aa&k2=bb&test=cc#999", "k2");
+--------------------------------------------------------------------------------+
| extract_url_parameter('http://doris.apache.org?k1=aa&k2=bb&test=cc#999', 'k2') |
+--------------------------------------------------------------------------------+
| bb                                                                             |
+--------------------------------------------------------------------------------+
```

If you want to get other part of URL, you can use [parse_url](./parse-url.md).

### keywords
    EXTRACT URL PARAMETER
