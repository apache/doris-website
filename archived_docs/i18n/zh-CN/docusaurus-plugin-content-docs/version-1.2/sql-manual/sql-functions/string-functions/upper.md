---
{
    "title": "UPPER",
    "language": "zh-CN"
}
---

## upper
## 描述
## 语法

`VARCHAR upper(VARCHAR str)`


将参数中所有的字符串都转换成大写，此函数的另一个别名为[ucase](./ucase.md)。

## 举例

```
mysql> SELECT upper("aBc123");
+-----------------+
| upper('aBc123') |
+-----------------+
| ABC123          |
+-----------------+
```
### keywords
    UPPER
