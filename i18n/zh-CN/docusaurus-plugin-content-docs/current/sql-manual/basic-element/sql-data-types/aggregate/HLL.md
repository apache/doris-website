---
{
    "title": "HLL(HyperLogLog)",
    "language": "zh-CN",
    "description": "HLL HLL 不能作为 key 列使用，支持在 Aggregate 模型、Duplicate 模型和 Unique 模型的表中使用。在 Aggregate 模型表中使用时，建表时配合的聚合类型为 HLLUNION。 用户不需要指定长度和默认值。长度根据数据的聚合程度系统内控制。"
}
---

## HLL(HyperLogLog)
## 描述
HLL
HLL 不能作为 key 列使用，支持在 Aggregate 模型、Duplicate 模型和 Unique 模型的表中使用。在 Aggregate 模型表中使用时，建表时配合的聚合类型为 HLL_UNION。
用户不需要指定长度和默认值。长度根据数据的聚合程度系统内控制。
并且 HLL 列只能通过配套的 hll_union_agg、hll_raw_agg、hll_cardinality、hll_hash 进行查询或使用。

HLL 是模糊去重，在数据量大的情况性能优于 Count Distinct。
HLL 的误差通常在 1% 左右，有时会达到 2%。

## 举例

    select hour, HLL_UNION_AGG(pv) over(order by hour) uv from(
       select hour, HLL_RAW_AGG(device_id) as pv
       from metric_table -- 查询每小时的累计UV
       where datekey=20200622
    group by hour order by 1
    ) final;

### keywords

    HLL,HYPERLOGLOG
