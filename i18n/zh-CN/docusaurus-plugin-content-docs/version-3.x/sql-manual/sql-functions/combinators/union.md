---
{
    "title": "UNION",
    "language": "zh-CN",
    "description": "将多个聚合中间结果聚合为一个。 结果的类型为 aggstate，函数签名与入参一致。"
}
---

## 描述

将多个聚合中间结果聚合为一个。
结果的类型为 agg_state，函数签名与入参一致。

## 语法

`AGGREGATE_FUNCTION_UNION(agg_state)`

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
AGG_STATE, UNION
