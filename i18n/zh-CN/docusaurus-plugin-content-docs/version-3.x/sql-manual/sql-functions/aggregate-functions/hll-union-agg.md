---
{
    "title": "HLL_UNION_AGG",
    "language": "zh-CN",
    "description": "HLLUNIONAGG 函数是一种聚合函数，主要用于将多个 HyperLogLog 数据结构合并，估算合并后基数的近似值。"
}
---

## 描述

HLL_UNION_AGG 函数是一种聚合函数，主要用于将多个 HyperLogLog 数据结构合并，估算合并后基数的近似值。


## 语法

```sql
hll_union_agg(<hll>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<hll>` | 需要被计算 HyperLogLog 类型表达式 |

## 返回值

返回 BIGINT 类型的基数值。

## 举例
```sql
select HLL_UNION_AGG(uv_set) from test_uv;
```

```text
+-------------------------+
| HLL_UNION_AGG(`uv_set`) |
+-------------------------+
| 17721                   |
+-------------------------+
```
