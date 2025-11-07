---
{
    "title": "TRIM",
    "language": "zh-CN"
}
---

## trim
## 描述
## 语法

`VARCHAR trim(VARCHAR str[, VARCHAR rhs])`


当没有rhs参数时，将参数 str 中右侧和左侧开始部分连续出现的空格去掉，否则去掉rhs

## 举例

```
mysql> SELECT trim('   ab d   ') str;
+------+
| str  |
+------+
| ab d |
+------+

mysql> SELECT trim('ababccaab','ab') str;
+------+
| str  |
+------+
| cca  |
+------+
```
### keywords
    TRIM
