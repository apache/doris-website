---
{
    "title": "HLL_TO_BASE64",
    "language": "zh-CN",
    "description": "将一个 HLL 类型转换为一个 base64 编码的字符串。"
}
---

## 描述

将一个 HLL 类型转换为一个 base64 编码的字符串。

## 语法

```sql
HLL_TO_BASE64(<hll_input>)
```

## 参数

| 参数            | 说明        |
|---------------|-----------|
| `<hll_input>` | HLL 类型数据。 |

## 返回值

HLL 基于 Base64 编码后的字符串。  
若 HLL 为 `NULL` 时，返回值为 `NULL`。

::: note

由于不能保证 HLL 中元素的顺序，因此不能保证相同内容的 HLL 生成的 base64 结果始终相同，但可以保证 hll_from_base64 解码后的 HLL 相同。

:::

## 示例

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