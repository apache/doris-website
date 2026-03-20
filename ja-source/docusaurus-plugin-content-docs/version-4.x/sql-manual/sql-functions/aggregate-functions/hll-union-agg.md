---
{
  "title": "HLL_UNION_AGG",
  "description": "HLLUNIONAGG関数は、複数のHyperLogLogデータ構造をマージし、近似カーディナリティを推定するために主に使用される集約関数です。",
  "language": "ja"
}
---
## 概要

HLL_UNION_AGG関数は、複数のHyperLogLogデータ構造をマージし、マージ後の概算カーディナリティを推定するために主に使用される集約関数です。

## 構文

```sql
hll_union_agg(<hll>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<hll>` | 計算対象の式。HLL型をサポート。 |

## Return Value

BIGINT型のカーディナリティ値を返します。
グループ内に有効なデータがない場合は、0を返します。

## Example

```sql
-- setup
create table test_uv(
    id int,
    uv_set string
) distributed by hash(id) buckets 1
properties ("replication_num"="1");
insert into test_uv values
    (1, ('a')),
    (1, ('b')),
    (2, ('c')),
    (2, ('d')),
    (3, null);
```
```sql
select HLL_UNION_AGG(HLL_HASH(uv_set)) from test_uv;
```
```text
+---------------------------------+
| HLL_UNION_AGG(HLL_HASH(uv_set)) |
+---------------------------------+
|                               4 |
+---------------------------------+
```
```sql
select HLL_UNION_AGG(HLL_HASH(uv_set)) from test_uv where uv_set is null;
```
```text
+---------------------------------+
| HLL_UNION_AGG(HLL_HASH(uv_set)) |
+---------------------------------+
|                               0 |
+---------------------------------+
```
