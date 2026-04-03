---
{
  "title": "HLL_EMPTY",
  "language": "ja",
  "description": "HLLEMPTYは、要素を持たないデータセットを表す空のHLL（HyperLogLog）値を返します。"
}
---
## 説明

`HLL_EMPTY`は空のHLL（HyperLogLog）値を返し、要素を持たないデータセットを表します。

## 構文

```sql
HLL_EMPTY()
```
## 戻り値

要素のないデータセットを表す、空のHLL型の値を返します。

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
