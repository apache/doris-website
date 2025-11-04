---
{
    "title": "DOMAIN_WITHOUT_WWW",
    "language": "en"
}
---

## Description

Extract the domain name without the prefix www in the string URL

## Syntax

```sql
DOMAIN_WITHOUT_WWW ( <url> )
```

## Parameters

| Parameter | Description |
|-----------|----------------------|
| `<url>`   | Need to extract the `URL` without the www domain name |

## Return value

Parameter `<url>` Domain name without the prefix www

```sql
SELECT DOMAIN_WITHOUT_WWW("https://www.apache.org/docs/gettingStarted/what-is-apache-doris")
```

```text
+---------------------------------------------------------------------------------------+
| domain_without_www('https://www.apache.org/docs/gettingStarted/what-is-apache-doris') |
+---------------------------------------------------------------------------------------+
| apache.org                                                                            |
+---------------------------------------------------------------------------------------+
```