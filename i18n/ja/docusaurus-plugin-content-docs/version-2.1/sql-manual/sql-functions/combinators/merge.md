---
{
  "title": "MERGE",
  "language": "ja",
  "description": "集約された中間結果を集約し計算して、実際の結果を取得する。"
}
---
## 説明

集約された中間結果が集約・計算されて、実際の結果が取得されます。
結果の型は`AGGREGATE_FUNCTION`と一致します。

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
AGG_STATE、MERGE
