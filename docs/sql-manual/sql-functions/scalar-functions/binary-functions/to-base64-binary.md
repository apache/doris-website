---
{
    "title": "TO_BASE64_BINARY",
    "language": "en",
    "description": "The TOBASE64BINARY function converts the input binary string into Base64 encoding format."
}
---

## Description

The TO_BASE64_BINARY function converts the input binary string into Base64 encoding format. Base64 encoding converts arbitrary binary data into a string composed of 64 characters.

## Syntax

```sql
TO_BASE64_BINARY(<bin>)
```

## Parameters
| Parameter | Description                                    |
| --------- | ---------------------------------------------- |
| `<bin>` | The binary to be Base64 encoded. Type: VARBINARY |

## Return Value

Returns VARCHAR type, representing the Base64 encoded string.

Special cases:
- If input is NULL, returns NULL
- If input is an empty string, returns an empty string

## Examples

1. Single character encoding
```sql
SELECT to_base64_binary(x'12');
```
```text
+-------------------------+
| to_base64_binary(x'12') |
+-------------------------+
| Eg==                    |
+-------------------------+
```

2. Multiple character encoding
```sql
SELECT to_base64_binary(x'234AAA');
```
```text
+-----------------------------+
| to_base64_binary(x'234AAA') |
+-----------------------------+
| I0qq                        |
+-----------------------------+
```