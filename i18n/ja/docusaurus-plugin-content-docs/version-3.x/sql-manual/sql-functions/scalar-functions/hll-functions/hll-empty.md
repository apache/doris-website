---
{
  "title": "HLL_EMPTY",
  "description": "HLLEMPTY は空の HLL（HyperLogLog）値を返し、要素を持たないデータセットを表します。",
  "language": "ja"
}
---
## 説明

`HLL_EMPTY`は空のHLL（HyperLogLog）値を返し、要素を持たないデータセットを表します。

## 構文

```sql
HLL_EMPTY()
```
## 戻り値

要素を持たないデータセットを表す、空のHLL型の値を返します。

## 例

```sql
select hll_cardinality(hll_empty());
```
```text
+------------------------------+
| hll_cardinality(hll_empty()) |
+------------------------------+
|                            0 |
+------------------------------+
```
