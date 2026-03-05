---
{
    "title": "LOWER",
    "language": "zh-CN"
}
---

## lower
## 描述
## 语法

`VARCHAR lower(VARCHAR str)`


将参数中所有的字符串都转换成小写，该函数的另一个别名为[lcase](./lcase.md)。

## 举例

```
mysql> SELECT lower("AbC123");
+-----------------+
| lower('AbC123') |
+-----------------+
| abc123          |
+-----------------+
```
### keywords
    LOWER
