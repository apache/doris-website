---
{
    "title": "GROUP_BIT_AND",
    "language": "zh-CN"
}
---

## group_bit_and
## 描述
## 语法

`expr GROUP_BIT_AND(expr)`

对expr进行 and 计算, 返回新的expr
支持所有INT类型

## 举例

```
mysql> select * from group_bit;
+-------+
| value |
+-------+
|     3 |
|     1 |
|     2 |
|     4 |
+-------+
4 rows in set (0.02 sec)

mysql> select group_bit_and(value) from group_bit;
+------------------------+
| group_bit_and(`value`) |
+------------------------+
|                      0 |
+------------------------+
```

### keywords

    GROUP_BIT_AND,BIT
