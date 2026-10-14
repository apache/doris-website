---
{
    "title": "HLL_EMPTY",
    "language": "ja",
    "description": "HLL_EMPTY は要素を含まないデータセットを表す空の HLL（HyperLogLog）値を返します。"
}
---

## 説明

`HLL_EMPTY` は要素を含まないデータセットを表す空の HLL（HyperLogLog）値を返します。

## 構文

```sql
HLL_EMPTY()
```

## 戻り値

要素を含まないデータセットを表す空の HLL 型の値を返します。

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