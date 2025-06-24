---
{
    "title": "QUOTE",
    "language": "zh-CN"
}
---

## quote
## 描述
## 语法

`VARCHAR quote(VARCHAR str)`

将参数中所有的字符串按原样输出，并用''套起来

## 举例

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