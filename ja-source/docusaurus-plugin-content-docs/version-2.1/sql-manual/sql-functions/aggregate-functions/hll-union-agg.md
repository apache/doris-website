---
{
  "title": "HLL_UNION_AGG",
  "language": "ja",
  "description": "HLLUNIONAGG関数は集約関数であり、主に複数のHyperLogLogデータ構造をマージし、近似値を推定するために使用されます"
}
---
## 説明

HLL_UNION_AGG関数は集約関数であり、主に複数のHyperLogLogデータ構造をマージし、結合されたカーディナリティの近似値を推定するために使用されます。

## 構文

```sql
hll_union_agg(<hll>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<hll>` | 計算対象のHyperLogLog型の式 |

## 戻り値

BIGINT型のカーディナリティ値を返します。

## 例

```sql
select HLL_UNION_AGG(uv_set) from test_uv;
```
```text
+-------------------------+
| HLL_UNION_AGG(`uv_set`) |
+-------------------------+
| 17721                   |
+-------------------------+
```
