---
{
    "title": "QUOTE",
    "language": "en"
}
---

## quote
### description
#### Syntax

`VARCHAR quote(VARCHAR str)`

Output all the strings in the argument as is and wrap them with ''

### example

```sql
mysql> select quote('hello world!\\t');
+-------------------------+
| quote('hello world!\t') |
+-------------------------+
| 'hello world!\t'        |
+-------------------------+
```

### keywords
    QUOTE