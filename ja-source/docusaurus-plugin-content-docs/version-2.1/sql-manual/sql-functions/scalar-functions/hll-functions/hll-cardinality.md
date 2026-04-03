---
{
  "title": "HLL_CARDINALITY",
  "language": "ja",
  "description": "HLLCARDINALITYは、HyperLogLog（HLL）型の値のカーディナリティを計算します。"
}
---
## 説明

`HLL_CARDINALITY`はHyperLogLog（HLL）型の値のカーディナリティを計算します。これは大規模なデータセット内の異なる要素数を推定するのに適した近似カウントアルゴリズムです。

## 構文

```sql
HLL_CARDINALITY(<hll>)
```
## パラメータ

| Parameter  | Description                                              |
| ---------- | -------------------------------------------------------- |
| `<hll>`    | カーディナリティを推定する必要があるデータセットを表すHLL型の値。 |

## 戻り値

HLL型の値の推定カーディナリティを返します。これはデータセット内の異なる要素の数を表します。

## 例

```sql
select HLL_CARDINALITY(uv_set) from test_uv;
```
```text
+---------------------------+
| hll_cardinality(`uv_set`) |
+---------------------------+
|                         3 |
+---------------------------+
```
