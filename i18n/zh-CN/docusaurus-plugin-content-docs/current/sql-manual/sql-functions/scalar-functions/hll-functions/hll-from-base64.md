---
{
    "title": "HLL_FROM_BASE64",
    "language": "zh-CN",
    "description": "将 hll_to_base64 生成的 base64 编码字符串还原为 HLL 类型。如果输入字符串不合法或为 NULL 则返回 NULL；若输入是原始二进制字节，请改用 hll_from_binary。"
}
---

## 描述

将一个 base64 编码的字符串（通常由 `HLL_TO_BASE64` 函数生成）转换为 HLL 类型。如果输入字符串不合法或为 NULL，则返回 NULL。

:::note

本函数期望输入 Base64 **文本**。Hive `binary` 等外部二进制列会映射为 `VARBINARY` 并保存原始序列化字节，`hll_from_base64` 在其上会返回 NULL。这类列请使用 [`hll_from_binary`](hll-from-binary)，或先用 `from_base64` 将文本解码为字节。

:::

## 语法

```sql
HLL_FROM_BASE64(<input>)
```

## 参数

| 参数     | 说明                                                                     |
| -------- | ------------------------------------------------------------------------ |
| `<input>` | base64 编码的字符串，通常由 `HLL_TO_BASE64` 函数生成。如果字符串不合法，则返回 NULL。 |

## 示例

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