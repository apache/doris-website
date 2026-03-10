---
{
  "title": "HLL_EMPTY",
  "language": "ja",
  "description": "HLLEMPTYは空のHLL（HyperLogLog）値を返し、要素が存在しないデータセットを表します。"
}
---
## 説明

`HLL_EMPTY`は空のHLL（HyperLogLog）値を返し、要素のないデータセットを表します。

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
