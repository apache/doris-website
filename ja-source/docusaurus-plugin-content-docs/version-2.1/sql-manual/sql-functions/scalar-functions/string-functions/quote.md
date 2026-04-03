---
{
  "title": "QUOTE",
  "language": "ja",
  "description": "引数内のすべての文字列をそのまま出力し、''で囲む"
}
---
## quote
### 説明
#### 構文

`VARCHAR quote(VARCHAR str)`

引数内のすべての文字列をそのまま出力し、''で囲みます

### 例

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
