---
{
    "title": "URL_ENCODE",
    "language": "en"
}
---
## Description

Use UTF-8 encoding to complete the URL encoding of the provided text. Typically used to encode parameter information passed as part of a URL

## Syntax

```sql
URL_ENCODE(  <str>  ) 
```

## Required Parameters

## Required Parameters
| Parameters | Description |
|------|------|
| `<str>` | String to be encoded |

##  Return Value


UTF-8 encoding completes the URL encoding of the provided text

##  Example

```sql
select  URL_ENCODE('Doris Q&A');
```

```sql
+-------------------------+
| url_encode('Doris Q&A') |
+-------------------------+
| Doris+Q%26A             |
+-------------------------+

```