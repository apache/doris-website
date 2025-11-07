---
{
    "title": "DOMAIN",
    "language": "en"
}
---

## Description

Extract the domain name from the string URL

## Syntax

```sql
DOMAIN ( <url> )
```

## Parameters

| Parameter | Description |
|-----------|--------------------|
| `<url>`   | `URL` from which the domain name needs to be extracted |

## Return value

Domain name of parameter `<url>`

## Example

```sql
SELECT DOMAIN("https://doris.apache.org/docs/gettingStarted/what-is-apache-doris")
```

```text
+-----------------------------------------------------------------------------+
| domain('https://doris.apache.org/docs/gettingStarted/what-is-apache-doris') |
+-----------------------------------------------------------------------------+
| doris.apache.org                                                            |
+-----------------------------------------------------------------------------+
```