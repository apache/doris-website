---
{
    "title": "CORR_WELFORD",
    "language": "zh-CN",
    "description": "采用 Welford 算法计算两个随机变量的皮尔逊系数，能够有效降低计算误差。"
}
---

## 描述

采用 [Welford](https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm) 算法计算两个随机变量的皮尔逊系数，能够有效降低计算误差。

## 语法

```sql
CORR_WELFORD(<expr1>, <expr2>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr1>` | Double 表达式（列） |
| `<expr2>` | Double 表达式（列） |

## 返回值

返回值为 DOUBLE 类型，expr1 和 expr2 的协方差，除 expr1 和 expr2 的标准差乘积，特殊情况：

- 如果 expr1 或 expr2 的标准差为 0, 将返回 0。
- 如果 expr1 或者 expr2 某一列为 NULL 时，该行数据不会被统计到最终结果中。

## 举例

```sql
select * from test_corr;
```

```text
+------+------+------+
| id   | k1   | k2   |
+------+------+------+
|    1 |   20 |   22 |
|    1 |   10 |   20 |
|    2 |   36 |   21 |
|    2 |   30 |   22 |
|    2 |   25 |   20 |
|    3 |   25 | NULL |
|    4 |   25 |   21 |
|    4 |   25 |   22 |
|    4 |   25 |   20 |
+------+------+------+
```

```sql
select id,corr_welford(k1,k2) from test_corr group by id;
```

```text
+------+---------------------+
| id   | corr_welford(k1,k2) |
+------+---------------------+
|    2 |  0.4539206495016017 |
|    4 |                   0 |
|    3 |                NULL |
|    1 |                   1 |
+------+---------------------+
```
