---
{
    "title": "LENGTH",
    "language": "zh-CN"
}
---

## length
## 描述
## 语法

`INT length(VARCHAR str)`


返回字符串的字节。

## 举例

```
mysql> select length("abc");
+---------------+
| length('abc') |
+---------------+
|             3 |
+---------------+

mysql> select length("中国");
+------------------+
| length('中国')   |
+------------------+
|                6 |
+------------------+
```
### keywords
    LENGTH
