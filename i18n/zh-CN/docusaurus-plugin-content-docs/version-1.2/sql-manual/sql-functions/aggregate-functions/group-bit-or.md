---
{
    "title": "GROUP_BIT_OR",
    "language": "zh-CN"
}
---

## group_bit_or
## 描述
## 语法

`expr GROUP_BIT_OR(expr)`

对expr进行 or 计算, 返回新的expr
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

mysql> select group_bit_or(value) from group_bit;
+-----------------------+
| group_bit_or(`value`) |
+-----------------------+
|                     7 |
+-----------------------+
```

### keywords

    GROUP_BIT_OR,BIT
