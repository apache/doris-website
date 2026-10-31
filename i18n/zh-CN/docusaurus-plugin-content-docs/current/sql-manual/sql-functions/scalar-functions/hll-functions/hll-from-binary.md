---
{
    "title": "HLL_FROM_BINARY",
    "language": "zh-CN",
    "description": "将 Doris HLL 的二进制序列化字节（VARBINARY）转化为一个 HLL，可直接读取 Hive、Parquet、ORC 等外部表中的 binary 列。当输入字节不合法或被截断时，返回 NULL 而不报错。"
}
---

## 描述

将 Doris HLL 的二进制序列化字节转化为一个 HLL。输入为 VARBINARY 类型的值，字节格式可由 `hll_to_binary` 生成，也可以是 Doris Hive UDF 包中的 Hive UDF（`to_hll` / `hll_union`）生成的字节。当输入字节不合法或被截断时，返回 NULL。

## 语法

```sql
HLL_FROM_BINARY(<binary>)
```

## 参数

| 参数        | 描述                                                                                                                      |
|-----------|--------------------------------------------------------------------------------------------------------------------------|
| `<binary>` | 包含 Doris HLL 序列化字节的 VARBINARY 值，例如通过 Catalog 读取的 Hive `binary` 列，或 `hll_to_binary` 的输出 |

## 返回值

返回一个 HLL。
当输入字节不合法或被截断时（例如类型码未知、负载被截断、输入为空），返回 NULL。

## 举例

转换 `NULL` 输入（注意 `hll_cardinality(NULL)` 返回 `0`）：

```sql
select hll_cardinality(hll_from_binary(NULL));
```

结果为：

```text
+----------------------------------------+
| hll_cardinality(hll_from_binary(NULL)) |
+----------------------------------------+
|                                      0 |
+----------------------------------------+
```

转换空 HLL 的二进制形式，通过 `to_base64_binary` 展示：

```sql
select to_base64_binary(hll_to_binary(hll_empty()));
```

结果为：

```text
+----------------------------------------------+
| to_base64_binary(hll_to_binary(hll_empty())) |
+----------------------------------------------+
| AA==                                         |
+----------------------------------------------+
```

转换包含一个元素的 HLL 的二进制形式：

```sql
select hll_cardinality(hll_from_binary(hll_to_binary(hll_hash('abc'))));
```

结果为：

```text
+------------------------------------------------------------------+
| hll_cardinality(hll_from_binary(hll_to_binary(hll_hash('abc')))) |
+------------------------------------------------------------------+
|                                                                1 |
+------------------------------------------------------------------+
```

不合法或被截断的字节返回 `NULL`，而不会报错：

```sql
select hll_from_binary(sub_binary(hll_to_binary(hll_hash('abc')), 1, 2)) is null;
```

结果为：

```text
+---------------------------------------------------------------------------+
| hll_from_binary(sub_binary(hll_to_binary(hll_hash('abc')), 1, 2)) is null |
+---------------------------------------------------------------------------+
|                                                                         1 |
+---------------------------------------------------------------------------+
```
