---
{
    "title": "HLL_FROM_BASE64",
    "language": "ja",
    "description": "Base64 でエンコードされた文字列（通常は HLL_TO_BASE64 関数の結果）を HLL に変換します。入力が無効または NULL の場合は NULL を返します。"
}
---

## 説明

Base64 でエンコードされた文字列（通常は `HLL_TO_BASE64` 関数の結果）を HLL に変換します。入力文字列が無効または NULL の場合、NULL を返します。

## 構文

```sql
HLL_FROM_BASE64(<input>)
```

## 引数

| 引数 | 説明                                                                 |
| --------- | --------------------------------------------------------------------------- |
| `<input>` | Base64 でエンコードされた文字列。通常は `HLL_TO_BASE64` 関数で生成します。入力文字列が無効または NULL の場合、NULL を返します。 |

## 例

<!-- setup-sql
CREATE TABLE test_hll (id INT, pv HLL HLL_UNION) AGGREGATE KEY(id) DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO test_hll VALUES (1, hll_hash('a')), (2, hll_hash('b')), (3, hll_hash('c'));
-->

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

```sql
select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash(''))));
```

```text
+---------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('')))) |
+---------------------------------------------------------------+
|                                                             1 |
+---------------------------------------------------------------+
```

```sql
select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash(NULL))));
```

```text
+-----------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash(NULL)))) |
+-----------------------------------------------------------------+
|                                                               0 |
+-----------------------------------------------------------------+
```