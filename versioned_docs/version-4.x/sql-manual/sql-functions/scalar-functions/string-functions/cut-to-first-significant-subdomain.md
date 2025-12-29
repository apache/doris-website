---
{
    "title": "CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN",
    "language": "en",
    "description": "The CUTTOFIRSTSIGNIFICANTSUBDOMAIN function extracts the effective part of a domain from a URL,"
}
---

## Description

The CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN function extracts the effective part of a domain from a URL, including the top-level domain up to the "first significant subdomain". If the input URL is invalid, it returns an empty string.

## Syntax

```sql
CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN(<url>)
```

## Parameters
| Parameter | Description                                   |
| --------- | --------------------------------------------- |
| `<url>` | The URL string to be processed. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the extracted domain part.

Special cases:
- If url is NULL, returns NULL
- If url is not a valid domain format, returns an empty string

## Examples

1. Basic domain processing
```sql
SELECT cut_to_first_significant_subdomain('www.baidu.com');
```
```text
+-----------------------------------------------------+
| cut_to_first_significant_subdomain('www.baidu.com') |
+-----------------------------------------------------+
| baidu.com                                           |
+-----------------------------------------------------+
```

2. Multi-level domain processing
```sql
SELECT cut_to_first_significant_subdomain('www.google.com.cn');
```
```text
+---------------------------------------------------------+
| cut_to_first_significant_subdomain('www.google.com.cn') |
+---------------------------------------------------------+
| google.com.cn                                           |
+---------------------------------------------------------+
```

3. Invalid domain processing
```sql
SELECT cut_to_first_significant_subdomain('wwwwwwww');
```
```text
+------------------------------------------------+
| cut_to_first_significant_subdomain('wwwwwwww') |
+------------------------------------------------+
|                                                |
+------------------------------------------------+
```