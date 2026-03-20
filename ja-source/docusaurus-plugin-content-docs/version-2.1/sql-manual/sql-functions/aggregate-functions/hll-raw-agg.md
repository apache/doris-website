---
{
  "title": "HLL_RAW_AGG",
  "language": "ja",
  "description": "HLLRAWAGG関数は集約関数であり、主に複数のHyperLogLogデータ構造をマージするために使用されます。"
}
---
## 説明

HLL_RAW_AGG関数は集約関数で、主に複数のHyperLogLogデータ構造をマージするために使用されます。

## エイリアス

- HLL_UNION

## 構文

```sql
HLL_RAW_AGG(<hll>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<hll>` | 計算対象のHyperLogLog型の式 |

## 戻り値

HyperLogLog型の集約値を返します。

## 例

```sql
select HLL_CARDINALITY(HLL_RAW_AGG(uv_set)) from test_uv;
```
```text
+------------------------------------------+
|   HLL_CARDINALITY(HLL_RAW_AGG(`uv_set`)) |
+------------------------------------------+
|                                    17721 |
+------------------------------------------+
```
