---
{
    "title": "EXTRACT_URL_PARAMETER",
    "language": "en",
    "description": "Returns the value of the name parameter in the URL, if it exists, or an empty string otherwise."
}
---

## Description

Returns the value of the `name` parameter in the URL, if it exists, or an empty string otherwise.

If there are multiple parameters with this name, the first one that occurs is returned.

This function works assuming that the parameter name is encoded in the URL exactly as it is in the passed parameter.

If you want to get other parts of the URL, you can use [parse_url](parse-url.md)

## Syntax

```sql
EXTRACT_URL_PARAMETER ( <url> , <name> )
```

## Parameters

| Parameters | Description |
|------------|---------------|
| `<url>`    | The url string of the parameter to be returned |
| `<name>`   | The name of the parameter to be returned |

## Return Value

The value of the parameter `<name>` in `<url>`

## Example

```sql
SELECT EXTRACT_URL_PARAMETER("http://doris.apache.org?k1=aa&k2=bb&test=cc#999", "k2")
```

```text
+--------------------------------------------------------------------------------+
| extract_url_parameter('http://doris.apache.org?k1=aa&k2=bb&test=cc#999', 'k2') |
+--------------------------------------------------------------------------------+
| bb                                                                             |
+--------------------------------------------------------------------------------+
```