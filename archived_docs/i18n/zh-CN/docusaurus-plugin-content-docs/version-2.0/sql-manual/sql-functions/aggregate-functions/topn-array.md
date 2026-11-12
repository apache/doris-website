---
{
    "title": "TOPN_ARRAY",
    "language": "zh-CN"
}
---

## TOPN_ARRAY
## 描述
## 语法

`ARRAY<T> topn_array(expr, INT top_num[, INT space_expand_rate])`

该topn_array函数使用Space-Saving算法计算expr中的top_num个频繁项，返回由前top_num个组成的数组，该结果为近似值

space_expand_rate参数是可选项，该值用来设置Space-Saving算法中使用的counter个数
```
counter numbers = top_num * space_expand_rate
```
space_expand_rate的值越大，结果越准确，默认值为50

## 举例
```
mysql> select topn_array(k3,3) from baseall;
+--------------------------+
| topn_array(`k3`, 3)      |
+--------------------------+
| [3021, 2147483647, 5014] |
+--------------------------+
1 row in set (0.02 sec)

mysql> select topn_array(k3,3,100) from baseall;
+--------------------------+
| topn_array(`k3`, 3, 100) |
+--------------------------+
| [3021, 2147483647, 5014] |
+--------------------------+
1 row in set (0.02 sec)
```
### keywords
TOPN, TOPN_ARRAY
