---
{
    "title": "MERGE",
    "language": "ja",
    "description": "集約処理の中間結果を集約して計算し、実際の結果を得ます。"
}
---

## 説明

集約処理の中間結果を集約して計算し、実際の結果を得ます。
結果の型は `AGGREGATE_FUNCTION` の結果の型と同じです。

## 構文

`AGGREGATE_FUNCTION_MERGE(agg_state)`

## 例
```
mysql [test]>select avg_merge(avg_state(1)) from d_table;
+-------------------------+
| avg_merge(avg_state(1)) |
+-------------------------+
|                       1 |
+-------------------------+
```
### キーワード
AGG_STATE, MERGE
