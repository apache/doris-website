---
{
    "title": "GROUP_BIT_XOR",
    "language": "zh-CN"
}
---

## group_bit_xor
## 描述
## 语法

`expr GROUP_BIT_XOR(expr)`

对expr进行 xor 计算, 返回新的expr
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

mysql> select group_bit_xor(value) from group_bit;
+------------------------+
| group_bit_xor(`value`) |
+------------------------+
|                      4 |
+------------------------+
```

### keywords

    GROUP_BIT_XOR,BIT
