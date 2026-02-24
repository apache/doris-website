---
{
    "title": "FROM_BASE64_BINARY",
    "language": "en",
    "description": "The FROMBASE64BINARY function decodes a Base64-encoded string and returns the result as a VARBINARY value."
}
---

## Description

The FROM_BASE64_BINARY function decodes a Base64-encoded string and returns the result as a VARBINARY value.

Special cases:

- If the input string is not a valid Base64-encoded string, the function returns NULL.

## Syntax

```sql
FROM_BASE64_BINARY ( <str> )
```

## Parameters

| Parameter | Description                                            |
| --------- | ------------------------------------------------------ |
| `<str>`   | The Base64-encoded string to be decoded.               |

## Return value

The parameter `<str>` decoded from Base64, returned as a VARBINARY result.

Special cases:

- When the input string is invalid (contains characters not possible in Base64 encoding), returns NULL.

## Example

```sql
SELECT FROM_BASE64_BINARY('MQ==');
```

```text
+--------------------------------------------------------+
| FROM_BASE64_BINARY('MQ==')                             |
+--------------------------------------------------------+
| 0x31                                                   |
+--------------------------------------------------------+
```

```sql
SELECT FROM_BASE64_BINARY('MjM0');
```

```text
+--------------------------------------------------------+
| FROM_BASE64_BINARY('MjM0')                             |
+--------------------------------------------------------+
| 0x323334                                               |
+--------------------------------------------------------+
```

```sql
SELECT FROM_BASE64_BINARY(NULL);
```

```text
+----------------------------------------------------+
| FROM_BASE64_BINARY(NULL)                           |
+----------------------------------------------------+
| NULL                                               |
+----------------------------------------------------+
```
