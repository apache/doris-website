---
{
    "title": "TOPN_WEIGHTED",
    "language": "zh-CN"
}
---

## TOPN_WEIGHTED
## 描述
## 语法

`ARRAY<T> topn_weighted(expr, BigInt weight, INT top_num[, INT space_expand_rate])`

该topn_weighted函数使用Space-Saving算法计算，取expr中权重和为前top_num个数组成的结果，该结果为近似值

space_expand_rate参数是可选项，该值用来设置Space-Saving算法中使用的counter个数
```
counter numbers = top_num * space_expand_rate
```
space_expand_rate的值越大，结果越准确，默认值为50

## 举例
```
mysql> select topn_weighted(k5,k1,3) from baseall;
+------------------------------+
| topn_weighted(`k5`, `k1`, 3) |
+------------------------------+
| [0, 243.325, 100.001]        |
+------------------------------+
1 row in set (0.02 sec)

mysql> select topn_weighted(k5,k1,3,100) from baseall;
+-----------------------------------+
| topn_weighted(`k5`, `k1`, 3, 100) |
+-----------------------------------+
| [0, 243.325, 100.001]             |
+-----------------------------------+
1 row in set (0.02 sec)
```
### keywords
TOPN, TOPN_WEIGHTED
