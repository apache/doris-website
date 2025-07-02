---
{
    "title": "FROM_BASE64",
    "language": "zh-CN"
}
---

## from_base64
## 描述
## 语法

`VARCHAR from_base64(VARCHAR str)`


返回对输入的字符串进行Base64解码后的结果

## 举例

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
