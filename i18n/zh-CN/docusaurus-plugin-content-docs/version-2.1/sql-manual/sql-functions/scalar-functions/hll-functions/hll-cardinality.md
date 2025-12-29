---
{
    "title": "HLL_CARDINALITY",
    "language": "zh-CN",
    "description": "HLLCARDINALITY 用于计算 HLL（HyperLogLog）类型值的基数。HLL 是一种近似计数的算法，适用于大规模数据集的基数估算。"
}
---

## 描述

`HLL_CARDINALITY` 用于计算 HLL（HyperLogLog）类型值的基数。HLL 是一种近似计数的算法，适用于大规模数据集的基数估算。

## 语法

```sql
HLL_CARDINALITY(<hll>)
```

## 参数

| 参数  | 说明                                   |
| ---- | -------------------------------------- |
| `<hll>` | HLL 类型的值，表示需要计算基数的数据集合。 |

## 返回值

返回 HLL 类型值的基数，即数据集合中不重复元素的估算数。

## 举例

```sql
select HLL_CARDINALITY(uv_set) from test_uv;
```

```text
+---------------------------+
| hll_cardinality(`uv_set`) |
+---------------------------+
|                         3 |
+---------------------------+
```