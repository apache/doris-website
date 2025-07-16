---
{
    "title": "CHAR_LENGTH",
    "language": "zh-CN"
}
---

## char_length
## 描述
## 语法

`INT char_length(VARCHAR str)`


返回字符串的长度，对于多字节字符，返回字符数, 目前仅支持utf8 编码。这个函数还有一个别名 `character_length`。

## 举例

```
mysql> select char_length("abc");
+--------------------+
| char_length('abc') |
+--------------------+
|                  3 |
+--------------------+

mysql> select char_length("中国");
+------------------- ---+
| char_length('中国')   |
+-----------------------+
|                     2 |
+-----------------------+
```
### keywords
    CHAR_LENGTH, CHARACTER_LENGTH
