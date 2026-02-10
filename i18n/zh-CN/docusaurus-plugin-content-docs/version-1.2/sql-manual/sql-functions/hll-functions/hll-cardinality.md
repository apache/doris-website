---
{
    "title": "HLL_CARDINALITY",
    "language": "zh-CN"
}
---

## HLL_CARDINALITY
## 描述
## 语法

`HLL_CARDINALITY(hll)`

HLL_CARDINALITY 用于计算 HLL 类型值的基数。

## 举例
```
MySQL > select HLL_CARDINALITY(uv_set) from test_uv;
+---------------------------+
| hll_cardinality(`uv_set`) |
+---------------------------+
|                         3 |
+---------------------------+
```
### keywords
HLL,HLL_CARDINALITY
