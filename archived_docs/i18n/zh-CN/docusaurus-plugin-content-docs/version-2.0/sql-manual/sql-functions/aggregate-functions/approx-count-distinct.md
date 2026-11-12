---
{
    "title": "APPROX_COUNT_DISTINCT",
    "language": "zh-CN"
}
---

## 描述
## 语法

`APPROX_COUNT_DISTINCT(expr)`

返回类似于 `COUNT(DISTINCT col)` 结果的近似值聚合函数。

它基于 HyperLogLog 算法实现，使用固定大小的内存估算列基数。该算法基于尾部零分布假设进行计算，具体精确程度取决于数据分布。基于 Doris 使用的固定桶大小，该算法相对标准误差为 0.8125%

更详细具体的分析，详见[相关论文](https://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf)

## 举例

```sql
MySQL > select approx_count_distinct(query_id) from log_statis group by datetime;
+-----------------+
| approx_count_distinct(`query_id`) |
+-----------------+
| 17721           |
+-----------------+
```

### Keywords
  APPROX_COUNT_DISTINCT
