---
{
  "title": "状態",
  "language": "ja",
  "description": "集約関数の中間結果を返します。"
}
---
## description

集計関数の中間結果を返します。これは後続の集計に使用したり、merge combinerを通じて実際の計算結果を取得したり、agg_state型のテーブルに直接書き込んで保存したりできます。
結果の型はagg_stateで、agg_state内の関数シグネチャは`AGGREGATE_FUNCTION(arg...)`です。

## Syntax

`AGGREGATE_FUNCTION_STATE(arg...)`

## example

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
