---
{
    "title": "TO_BASE64",
    "language": "en"
}
---

## Description

The TO_BASE64 function is used to convert an input string to Base64 encoded format. Base64 encoding can convert any binary data into a string composed of 64 characters.

## Syntax

```sql
TO_BASE64(<str>)
```

## Parameters
| Parameter | Description                                    |
| --------- | ---------------------------------------------- |
| `<str>` | The string to be Base64 encoded. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the Base64 encoded string.

Special cases:
- If input is NULL, returns NULL
- If input is an empty string, returns an empty string

## Examples

1. Single character encoding
```sql
SELECT to_base64('1');
```
```text
+----------------+
| to_base64('1') |
+----------------+
| MQ==           |
+----------------+
```

2. Multiple character encoding
```sql
SELECT to_base64('234');
```
```text
+------------------+
| to_base64('234') |
+------------------+
| MjM0             |
+------------------+
```