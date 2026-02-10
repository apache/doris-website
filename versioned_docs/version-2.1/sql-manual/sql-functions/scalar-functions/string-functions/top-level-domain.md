---
{
    "title": "TOP_LEVEL_DOMAIN",
    "language": "en",
    "description": "The TOPLEVELDOMAIN function is used to extract the top-level domain from a URL. If the input URL is invalid, it returns an empty string."
}
---

## Description

The TOP_LEVEL_DOMAIN function is used to extract the top-level domain from a URL. If the input URL is invalid, it returns an empty string.

## Syntax

```sql
TOP_LEVEL_DOMAIN(<url>)
```

## Parameters
| Parameter | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| `<url>` | The URL string from which to extract the top-level domain. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the extracted top-level domain.

Special cases:
- Returns NULL if url is NULL
- Returns an empty string if url is not a valid URL format
- For multi-level domains (e.g., .com.cn), returns the last level domain

## Examples

1. Basic domain processing
```sql
SELECT top_level_domain('www.baidu.com');
```
```text
+-----------------------------------+
| top_level_domain('www.baidu.com') |
+-----------------------------------+
| com                               |
+-----------------------------------+
```

2. Multi-level domain processing
```sql
SELECT top_level_domain('www.google.com.cn');
```
```text
+---------------------------------------+
| top_level_domain('www.google.com.cn') |
+---------------------------------------+
| cn                                    |
+---------------------------------------+
```

3. Invalid URL processing
```sql
SELECT top_level_domain('wwwwwwww');
```
```text
+------------------------------+
| top_level_domain('wwwwwwww') |
+------------------------------+
|                              |
+------------------------------+
```