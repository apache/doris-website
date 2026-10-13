---
{
    "title": "HLL_UNION_AGG",
    "language": "ja",
    "description": "HLL_UNION_AGG 関数は、主に複数の HyperLogLog データ構造をマージし、概算基数を推定するために使用する集約関数です。"
}
---

## 説明

HLL_UNION_AGG 関数は、主に複数の HyperLogLog データ構造をマージし、マージ後の概算基数を推定するために使用する集約関数です。

## 構文

```sql
hll_union_agg(<hll>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<hll>` | 計算対象の式。HLL 型をサポートします。 |

## 戻り値

基数を BIGINT 型の値として返します。
グループ内に有効なデータがない場合は 0 を返します。

## 例

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
