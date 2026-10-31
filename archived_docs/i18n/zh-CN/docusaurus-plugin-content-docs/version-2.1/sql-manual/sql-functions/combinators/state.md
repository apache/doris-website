---
{
    "title": "STATE",
    "language": "zh-CN",
    "description": "返回聚合函数的中间结果，可以用于后续的聚合或者通过 merge 组合器获得实际计算结果，也可以直接写入 aggstate 类型的表保存下来。 结果的类型为 aggstate，aggstate 中的函数签名为AGGREGATEFUNCTION(arg...)。"
}
---

## 描述

返回聚合函数的中间结果，可以用于后续的聚合或者通过 merge 组合器获得实际计算结果，也可以直接写入 agg_state 类型的表保存下来。
结果的类型为 agg_state，agg_state 中的函数签名为`AGGREGATE_FUNCTION(arg...)`。

## 语法

`AGGREGATE_FUNCTION_STATE(arg...)`

## 举例
```
mysql [test]>select avg_merge(t) from (select avg_union(avg_state(1)) as t from d_table group by k1)p;
+----------------+
| avg_merge(`t`) |
+----------------+
|              1 |
+----------------+
```
### keywords
AGG_STATE,STATE
