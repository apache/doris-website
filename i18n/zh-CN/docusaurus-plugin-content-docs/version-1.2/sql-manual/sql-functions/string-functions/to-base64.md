---
{
    "title": "TO_BASE64",
    "language": "zh-CN"
}
---

## to_base64
## 描述
## 语法

`VARCHAR to_base64(VARCHAR str)`


返回对输入的字符串进行Base64编码后的结果

## 举例

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
