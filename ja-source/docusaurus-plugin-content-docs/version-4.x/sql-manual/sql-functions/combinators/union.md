---
{
  "title": "UNION",
  "description": "複数の集約中間結果を一つに集約します。結果の型はaggstateです。",
  "language": "ja"
}
---
## 説明

複数の集計中間結果を1つに集約します。
結果の型はagg_stateで、関数シグネチャは入力パラメータと一致します。

## 構文

`AGGREGATE_FUNCTION_UNION(agg_state)`

## 例

```
mysql [test]>select avg_merge(t) from (select avg_union(avg_state(1)) as t from d_table group by k1)p;
+----------------+
| avg_merge(`t`) |
+----------------+
|              1 |
+----------------+
```
### Keywords
AGG_STATE、UNION
