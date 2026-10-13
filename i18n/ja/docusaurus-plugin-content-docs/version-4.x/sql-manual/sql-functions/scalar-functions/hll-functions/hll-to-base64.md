---
{
    "title": "HLL_TO_BASE64",
    "language": "ja",
    "description": "入力した HLL を Base64 でエンコードされた文字列に変換します。"
}
---

## 説明

入力した HLL を Base64 でエンコードされた文字列に変換します。

## 構文

```sql
HLL_TO_BASE64(<hll_input>)
```

## 引数

| 引数    | 説明                                          |
| ------------ | ---------------------------------------------------- |
| `<hll_input>` | Base64 でエンコードされた文字列に変換する HyperLogLog（HLL）データ。 |

## 戻り値

HLL を Base64 でエンコードした文字列を返します。
HLL が `NULL` の場合は `NULL` を返します。

::: note

HLL 内の要素の順序は保証されないため、内容が同じでも生成される Base64 文字列は異なる場合があります。ただし、`hll_from_base64` で復元した HLL の内容は同じです。

:::

## 例

<!-- setup-sql
CREATE TABLE test_hll (id INT, pv HLL HLL_UNION) AGGREGATE KEY(id) DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO test_hll VALUES (1, hll_hash('a')), (2, hll_hash('b')), (3, hll_hash('c'));
-->

```sql
select hll_to_base64(NULL);
```

```text
+---------------------+
| hll_to_base64(NULL) |
+---------------------+
| NULL                |
+---------------------+
```

```sql
select hll_to_base64(hll_empty());
```

```text
+----------------------------+
| hll_to_base64(hll_empty()) |
+----------------------------+
| AA==                       |
+----------------------------+
```

```sql
select hll_to_base64(hll_hash('abc'));
```

```text
+--------------------------------+
| hll_to_base64(hll_hash('abc')) |
+--------------------------------+
| AQEC5XSzrpDsdw==               |
+--------------------------------+
```

```sql
select hll_union_agg(hll_from_base64(hll_to_base64(pv))), hll_union_agg(pv) from test_hll;
```

```text
+---------------------------------------------------+-------------------+
| hll_union_agg(hll_from_base64(hll_to_base64(pv))) | hll_union_agg(pv) |
+---------------------------------------------------+-------------------+
|                                                 3 |                 3 |
+---------------------------------------------------+-------------------+
```

```sql
select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('abc'))));
```

```text
+------------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('abc')))) |
+------------------------------------------------------------------+
|                                                                1 |
+------------------------------------------------------------------+
```