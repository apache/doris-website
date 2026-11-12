---
{
    "title": "APPROX_COUNT_DISTINCT",
    "language": "zh-CN"
}
---

## APPROX_COUNT_DISTINCT
## 描述
## 语法

`APPROX_COUNT_DISTINCT(expr)`


返回类似于 COUNT(DISTINCT col) 结果的近似值聚合函数。

它比 COUNT 和 DISTINCT 组合的速度更快，并使用固定大小的内存，因此对于高基数的列可以使用更少的内存。

## 举例
```
MySQL > select approx_count_distinct(query_id) from log_statis group by datetime;
+-----------------+
| approx_count_distinct(`query_id`) |
+-----------------+
| 17721           |
+-----------------+
```
### keywords
APPROX_COUNT_DISTINCT
