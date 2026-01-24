---
{
    "title": "FIRST_SIGNIFICANT_SUBDOMAIN",
    "language": "en",
    "description": "Extract the \"first valid subdomain\" from the URL and return it. If it is illegal, an empty string will be returned."
}
---

## Description

Extract the "first valid subdomain" from the URL and return it. If it is illegal, an empty string will be returned.

## Syntax

```sql
FIRST_SIGNIFICANT_SUBDOMAIN ( <url> )
```

## Parameters

| Parameter | Description |
|-----------|----------------------|
| `<url>`   | The URL from which the "first valid subdomain" needs to be extracted |

## Return value

The first valid subdomain in `<url>`.

## Example

```sql
SELECT FIRST_SIGNIFICANT_SUBDOMAIN("www.baidu.com"),FIRST_SIGNIFICANT_SUBDOMAIN("www.google.com.cn"),FIRST_SIGNIFICANT_SUBDOMAIN("wwwwwwww")
```

```text
+----------------------------------------------+--------------------------------------------------+-----------------------------------------+
| first_significant_subdomain('www.baidu.com') | first_significant_subdomain('www.google.com.cn') | first_significant_subdomain('wwwwwwww') |
+----------------------------------------------+--------------------------------------------------+-----------------------------------------+
| baidu                                        | google                                           |                                         |
+----------------------------------------------+--------------------------------------------------+-----------------------------------------+
```