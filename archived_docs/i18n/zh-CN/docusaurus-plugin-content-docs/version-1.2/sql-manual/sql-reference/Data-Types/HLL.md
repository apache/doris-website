---
{
    "title": "HLL(HyperLogLog)",
    "language": "zh-CN"
}
---

## HLL(HyperLogLog)
## 描述
    HLL
    HLL不能作为key列使用，建表时配合聚合类型为HLL_UNION。
    用户不需要指定长度和默认值。长度根据数据的聚合程度系统内控制。
    并且HLL列只能通过配套的hll_union_agg、hll_raw_agg、hll_cardinality、hll_hash进行查询或使用。
    
    HLL是模糊去重，在数据量大的情况性能优于Count Distinct。
    HLL的误差通常在1%左右，有时会达到2%。

## 举例

    select hour, HLL_UNION_AGG(pv) over(order by hour) uv from(
       select hour, HLL_RAW_AGG(device_id) as pv
       from metric_table -- 查询每小时的累计UV
       where datekey=20200622
    group by hour order by 1
    ) final;

### keywords

    HLL,HYPERLOGLOG
