---
{
  "title": "HLL_UNION_AGG",
  "description": "HLLUNIONAGG関数は集約関数であり、主に複数のHyperLogLogデータ構造をマージし、概算を推定するために使用されます。",
  "language": "ja"
}
---
## 説明

HLL_UNION_AGG関数は集約関数であり、主に複数のHyperLogLogデータ構造をマージし、結合されたカーディナリティの近似値を推定するために使用されます。

## 構文

```sql
hll_union_agg(<hll>)
```
## パラメータ

| パラメータ | デスクリプション |
| -- | -- |
| `<hll>` | 計算対象のHyperLogLog型式 |

## Return Value

BIGINT型のカーディナリティ値を返します。

## Example

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
