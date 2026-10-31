---
{
    "title": "BIT_LENGTH",
    "language": "zh-CN"
}
---

## bit_length
## 描述
## 语法

`INT bit_length(VARCHAR str)`


返回字符串的位长度。

## 举例

```
mysql> select bit_length("abc");
+-------------------+
| bit_length('abc') |
+-------------------+
|                24 |
+-------------------+

mysql> select bit_length("中国");
+----------------------+
| bit_length('中国')    |
+----------------------+
|                   48 |
+----------------------+
```
### keywords
    BIT_LENGTH
