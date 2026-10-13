---
{
    "title": "HLL_CARDINALITY",
    "language": "ja",
    "description": "HLL_CARDINALITY は HyperLogLog（HLL）型の値のカーディナリティを計算します。"
}
---

## 説明

`HLL_CARDINALITY` は HyperLogLog（HLL）型の値のカーディナリティを計算します。大規模なデータセットに含まれる異なる要素の数を推定するのに適した近似カウントを使用します。

## 構文

```sql
HLL_CARDINALITY(<hll>)
```

## 引数

| 引数  | 説明                                              |
| ---------- | -------------------------------------------------------- |
| `<hll>`    | カーディナリティを推定するデータセットを表す HLL 型の値。 |

## 戻り値

HLL 型の値の推定カーディナリティを返します。これはデータセット内の異なる要素の数を表します。

## 例

<!-- setup-sql
CREATE TABLE test_uv (id INT, uv_set HLL HLL_UNION) AGGREGATE KEY(id) DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO test_uv VALUES (1, hll_hash('a')), (1, hll_hash('b')), (1, hll_hash('c'));
-->

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