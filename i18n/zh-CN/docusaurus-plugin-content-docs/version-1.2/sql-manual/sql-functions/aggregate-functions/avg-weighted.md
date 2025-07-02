---
{
    "title": "AVG_WEIGHTED",
    "language": "zh-CN"
}
---

## AVG_WEIGHTED
## 描述
## 语法

` double avg_weighted(x, weight)`

计算加权算术平均值, 即返回结果为: 所有对应数值和权重的乘积相累加，除总的权重和。
如果所有的权重和等于0, 将返回NaN。


## 举例

```
mysql> select avg_weighted(k2,k1) from baseall;
+--------------------------+
| avg_weighted(`k2`, `k1`) |
+--------------------------+
|                  495.675 |
+--------------------------+
1 row in set (0.02 sec)

```
### keywords
AVG_WEIGHTED
