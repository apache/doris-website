---
{
    "title": "RTRIM",
    "language": "zh-CN"
}
---

## rtrim
## 描述
## 语法

`VARCHAR rtrim(VARCHAR str[, VARCHAR rhs])`


当没有rhs参数时，将参数 str 中从右侧部分开始部分连续出现的空格去掉，否则去掉rhs

## 举例

```
mysql> SELECT rtrim('ab d   ') str;
+------+
| str  |
+------+
| ab d |
+------+

mysql> SELECT rtrim('ababccaab','ab') str;
+---------+
| str     |
+---------+
| ababcca |
+---------+
```
### keywords
    RTRIM
