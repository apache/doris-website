---
{
    "title": "FROM_BASE64",
    "language": "en"
}
---

## from_base64
### description
#### Syntax

`VARCHAR from_base64(VARCHAR str)`


Returns the result of Base64 decoding the input string

### example

```
mysql> select from_base64('MQ==');
+---------------------+
| from_base64('MQ==') |
+---------------------+
| 1                   |
+---------------------+

mysql> select from_base64('MjM0');
+---------------------+
| from_base64('MjM0') |
+---------------------+
| 234                 |
+---------------------+
```
### keywords
    from_base64
