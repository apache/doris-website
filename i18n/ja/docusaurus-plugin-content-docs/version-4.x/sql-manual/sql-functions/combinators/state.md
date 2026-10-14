---
{
    "title": "STATE",
    "language": "ja",
    "description": "集約関数の中間結果を返します。"
}
---

## 説明

集約関数の中間結果を返します。この結果は後続の集約処理に使用したり、MERGE コンビネータで実際の計算結果を取得したり、agg_state 型のテーブルに直接書き込んで保存したりできます。
結果の型は agg_state で、agg_state に含まれる関数のシグネチャは `AGGREGATE_FUNCTION(arg...)` です。

## 構文

`AGGREGATE_FUNCTION_STATE(arg...)`

## 例
```
mysql [test]>select avg_merge(t) from (select avg_union(avg_state(1)) as t from d_table group by k1)p;
+----------------+
| avg_merge(`t`) |
+----------------+
|              1 |
+----------------+
```
### キーワード
AGG_STATE,STATE
