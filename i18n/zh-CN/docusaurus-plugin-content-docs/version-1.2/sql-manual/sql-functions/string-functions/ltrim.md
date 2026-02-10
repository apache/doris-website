---
{
    "title": "LTRIM",
    "language": "zh-CN"
}
---

## ltrim
## 描述
## 语法
 
`VARCHAR ltrim(VARCHAR str[, VARCHAR rhs])`


当没有rhs参数时，将参数 str 中从左侧部分开始部分连续出现的空格去掉，否则去掉rhs

## 举例

```
mysql> SELECT ltrim('   ab d') str;
+------+
| str  |
+------+
| ab d |
+------+

mysql> SELECT ltrim('ababccaab','ab') str;
+-------+
| str   |
+-------+
| ccaab |
+-------+
```
### keywords
    LTRIM
