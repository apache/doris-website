---
{
    "title": "HLL_RAW_AGG",
    "language": "zh-CN",
    "description": "HLLRAWAGG 函数是一种聚合函数，主要用于将多个 HyperLogLog 数据结构合并成一个"
}
---

## 描述

HLL_RAW_AGG 函数是一种聚合函数，主要用于将多个 HyperLogLog 数据结构合并成一个

## 别名

- HLL_UNION

## 语法

```sql
HLL_RAW_AGG(<hll>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<hll>` | 需要被计算HyperLogLog类型表达式 |

## 返回值

返回被聚合后的 HLL 类型。

## 举例
```sql
select HLL_CARDINALITY(HLL_RAW_AGG(uv_set)) from test_uv;
```

```text
+------------------------------------------+
|   HLL_CARDINALITY(HLL_RAW_AGG(`uv_set`)) |
+------------------------------------------+
|                                    17721 |
+------------------------------------------+
```