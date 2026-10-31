---
{
    "title": "HLL_TO_BINARY",
    "language": "zh-CN",
    "description": "将一个 HLL 转化为其二进制的序列化字节，并以 VARBINARY 类型返回，便于写入 Hive binary 列或 Parquet、ORC 等二进制格式。它是 hll_to_base64 的字节级对应函数。"
}
---

## 描述

将一个 HLL 转化为其二进制的序列化字节，并以 VARBINARY 类型返回。

该函数是 `hll_to_base64` 的字节级对应版本。相比 Base64 表示，二进制形式更紧凑，在将 HLL 导出到 Parquet、ORC 等二进制文件格式或 Hive `binary` 列时，推荐使用本函数。

## 语法

```sql
HLL_TO_BINARY(<hll>)
```

## 参数

| 参数     | 描述             |
|--------|----------------|
| `<hll>` | HLL 类型列或表达式 |

## 返回值

返回 VARBINARY 类型的值，内容为 HLL 的序列化字节。
若 HLL 为 `NULL` 时，返回值为 `NULL`。

## 举例

将 `NULL` HLL 转化为二进制形式：

```sql
select hll_to_binary(NULL);
```

结果为：

```text
+---------------------+
| hll_to_binary(NULL) |
+---------------------+
| NULL                |
+---------------------+
```

将空 HLL 转化为二进制形式，通过 `to_base64_binary` 展示：

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

将包含一个元素的 HLL 转化为二进制形式，通过 `to_base64_binary` 展示：

```sql
select to_base64_binary(hll_to_binary(hll_hash('abc')));
```

结果为：

```text
+--------------------------------------------------+
| to_base64_binary(hll_to_binary(hll_hash('abc'))) |
+--------------------------------------------------+
| AQEC5XSzrpDsdw==                                 |
+--------------------------------------------------+
```

与 `hll_from_binary` 往返转换后，HLL 内容保持不变：

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
