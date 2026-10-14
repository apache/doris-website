---
{
    "title": "HLL_RAW_AGG",
    "language": "ja",
    "description": "HLLRAWAGG 関数は、主に複数の HyperLogLog データ構造を一つに統合する集約関数です。"
}
---

## 説明

HLL_RAW_AGG 関数は、主に複数の HyperLogLog データ構造を一つに統合する集約関数です。

## 別名

- HLL_UNION

## 構文

```sql
HLL_RAW_AGG(<hll>)
HLL_UNION(<hll>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<hll>` | 計算対象の式。HLL 型をサポートします。 |

## 戻り値

集約された HLL 型の値を返します。
グループ内に有効なデータがない場合は HLL_EMPTY を返します。

## 使用例

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
select HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) from test_uv;
```

```text
+------------------------------------------------+
| HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) |
+------------------------------------------------+
|                                              4 |
+------------------------------------------------+
```

```sql
select HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) from test_uv where uv_set is null;
```

```text
+------------------------------------------------+
| HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) |
+------------------------------------------------+
|                                              0 |
+------------------------------------------------+
```
