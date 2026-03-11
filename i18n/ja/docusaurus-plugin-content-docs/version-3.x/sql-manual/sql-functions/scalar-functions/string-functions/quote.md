---
{
  "title": "QUOTE",
  "description": "引数内のすべての文字列をそのまま出力し、''で囲む",
  "language": "ja"
}
---
## quote
### description
#### Syntax

`VARCHAR quote(VARCHAR str)`

引数内のすべての文字列をそのまま出力し、''で囲みます

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
