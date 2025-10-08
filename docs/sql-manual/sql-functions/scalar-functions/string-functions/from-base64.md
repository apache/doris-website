---
{
    "title": "FROM_BASE64",
    "language": "en"
}
---

## Description

Returns the result of Base64 decoding the input string. Special cases:

- When the input string is incorrect (a string that is not possible after Base64 encoding appears), NULL will be returned

## Syntax

```sql
FROM_BASE64 ( <str> )
```

## Parameters

| Parameters | Description |
|------------|-----------------|
| `<str>`    | The string to be Base64 decoded |

## Return value

Parameter `<str>` The result of Base64 decoding. Special cases:

- When the input string is incorrect (a string that is not possible after Base64 encoding appears), NULL will be returned.

## Example

```sql
SELECT FROM_BASE64('MQ=='),FROM_BASE64('MjM0'),FROM_BASE64(NULL)
```

```text
+---------------------+---------------------+-------------------+
| from_base64('MQ==') | from_base64('MjM0') | from_base64(NULL) |
+---------------------+---------------------+-------------------+
| 1                   | 234                 | NULL              |
+---------------------+---------------------+-------------------+
```