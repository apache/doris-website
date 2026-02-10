---
{
    "title": "MERGE",
    "language": "zh-CN",
    "description": "将聚合中间结果进行聚合并计算获得实际结果。 结果的类型与AGGREGATEFUNCTION一致。"
}
---

## 描述

将聚合中间结果进行聚合并计算获得实际结果。
结果的类型与`AGGREGATE_FUNCTION`一致。

## 语法

`AGGREGATE_FUNCTION_MERGE(agg_state)`

## 举例
```
mysql [test]>select avg_merge(avg_state(1)) from d_table;
+-------------------------+
| avg_merge(avg_state(1)) |
+-------------------------+
|                       1 |
+-------------------------+
```
### Keywords
AGG_STATE, MERGE
