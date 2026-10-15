---
{
    "title": "UNION",
    "language": "ja",
    "description": "複数の集約処理の中間結果を一つに集約します。結果の型は aggstate です。"
}
---

## 説明

複数の集約処理の中間結果を一つに集約します。
結果の型は agg_state で、関数のシグネチャは入力パラメータと一致します。

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
### キーワード
AGG_STATE, UNION
