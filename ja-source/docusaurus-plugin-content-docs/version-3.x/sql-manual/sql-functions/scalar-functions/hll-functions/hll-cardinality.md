---
{
  "title": "HLL_CARDINALITY",
  "description": "HLLCARDINALITY は HyperLogLog (HLL) 型の値のカーディナリティを計算します。",
  "language": "ja"
}
---
## 説明

`HLL_CARDINALITY`はHyperLogLog（HLL）型の値のカーディナリティを計算します。これは大規模なデータセット内の異なる要素数を推定するのに適した近似カウントアルゴリズムです。

## 構文

```sql
HLL_CARDINALITY(<hll>)
```
## パラメータ

| Parameter  | デスクリプション                                              |
| ---------- | -------------------------------------------------------- |
| `<hll>`    | カーディナリティを推定する必要があるデータセットを表すHLL型の値。 |

## 戻り値

HLL型の値の推定カーディナリティを返します。これはデータセット内の個別要素数を表します。

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
