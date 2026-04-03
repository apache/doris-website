---
{
  "title": "HLL_RAW_AGG",
  "description": "HLLRAWAGG関数は集計関数であり、主に複数のHyperLogLogデータ構造をマージするために使用されます。",
  "language": "ja"
}
---
## 概要

HLL_RAW_AGG関数は集約関数であり、主に複数のHyperLogLogデータ構造をマージするために使用されます。

## エイリアス

- HLL_UNION

## 構文

```sql
HLL_RAW_AGG(<hll>)
```
## パラメータ

| パラメータ | デスクリプション |
| -- | -- |
| `<hll>` | 計算対象のHyperLogLog型式 |

## Return Value

HyperLogLog型の集約値を返します。

## Example

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
