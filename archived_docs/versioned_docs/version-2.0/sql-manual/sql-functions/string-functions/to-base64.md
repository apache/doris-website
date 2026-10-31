---
{
    "title": "TO_BASE64",
    "language": "en"
}
---

## to_base64
### description
#### Syntax

`VARCHAR to_base64(VARCHAR str)`


Returns the result of Base64 encoding the input string

### example

```
mysql> select to_base64('1');
+----------------+
| to_base64('1') |
+----------------+
| MQ==           |
+----------------+

mysql> select to_base64('234');
+------------------+
| to_base64('234') |
+------------------+
| MjM0             |
+------------------+
```
### keywords
    to_base64
