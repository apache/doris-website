---
{
    "title": "PARSE_URL",
    "language": "en",
    "description": "The PARSEURL function is mainly used to parse URL strings and extract various components from them, such as protocols, hosts, paths, query parameters,"
}
---

## Description

The PARSE_URL function is mainly used to parse URL strings and extract various components from them, such as protocols, hosts, paths, query parameters, etc.

## Syntax

```sql
PARSE_URL( <url>, <name> )
```

## Parameters

| Parameter       | Description                                                                                      |
|----------|--------------------------------------------------------------------------------------------------|
| `<url>`  | URL that need to be parsed                                                                       |
| `<name>` | The parts to be extracted, and the optional values include `PROTOCOL`, `HOST`, `PATH`, `REF`, `AUTHORITY`, `FILE`, `USERINFO`, `PORT`, `QUERY` (case insensitive). |

## Return Value

Returns a specified part of `<url>`. Special cases:

- If any Parameter is NULL, NULL will be returned.
- If `<name>` is passed with other illegal values, an error will be occurred.

## Examples

```sql
SELECT parse_url ('https://doris.apache.org/', 'HOST');
```

```text
+------------------------------------------------+
| parse_url('https://doris.apache.org/', 'HOST') |
+------------------------------------------------+
| doris.apache.org                               |
+------------------------------------------------+
```

```sql
SELECT parse_url ('https://doris.apache.org/', null);
```

```text
+----------------------------------------------+
| parse_url('https://doris.apache.org/', NULL) |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```

## 相关命令

如果想获取 QUERY 中的特定 Parameter，可使用[extract_url_parameter](./extract-url-parameter.md)。
