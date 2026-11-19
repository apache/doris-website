---
{
    "title": "BITMAP_TO_BINARY",
    "language": "zh-CN",
    "description": "将一个 Bitmap 转化为其二进制的序列化字节，并以 VARBINARY 类型返回，便于写入 Hive binary 列或 Parquet、ORC 等二进制格式。它是 bitmap_to_base64 的字节级对应函数。"
}
---

## 描述

将一个 Bitmap 转化为其二进制的序列化字节，并以 VARBINARY 类型返回。

该函数是 `bitmap_to_base64` 的字节级对应版本。相比 Base64 表示，二进制形式更紧凑，在将 Bitmap 导出到 Parquet、ORC 等二进制文件格式或 Hive `binary` 列时，推荐使用本函数。

## 语法

```sql
BITMAP_TO_BINARY(<bitmap>)
```

## 参数

| 参数        | 描述             |
|-----------|----------------|
| `<bitmap>` | Bitmap 类型列或表达式 |

## 返回值

返回 VARBINARY 类型的值，内容为 Bitmap 的序列化字节。
若 Bitmap 为 `NULL` 时，返回值为 `NULL`。

::: note

BE 配置项 `enable_set_in_bitmap_value` 会改变 bitmap 值在内存中的具体格式，从而影响本函数的结果。
由于 bitmap 中元素的顺序不保证，相同内容生成的字节可能不完全一致。但通过 `bitmap_from_binary` 解码后的 bitmap 内容是一致的。

:::

## 举例

将 `NULL` Bitmap 转化为二进制形式：

```sql
select bitmap_to_binary(null);
```

结果为：

```text
+------------------------+
| bitmap_to_binary(null) |
+------------------------+
| NULL                   |
+------------------------+
```

将空 Bitmap 转化为二进制形式，通过 `to_base64_binary` 展示：

```sql
select to_base64_binary(bitmap_to_binary(bitmap_empty()));
```

结果为：

```text
+----------------------------------------------------+
| to_base64_binary(bitmap_to_binary(bitmap_empty())) |
+----------------------------------------------------+
| AA==                                               |
+----------------------------------------------------+
```

将包含单个元素的 Bitmap 转化为二进制形式，通过 `to_base64_binary` 展示：

```sql
select to_base64_binary(bitmap_to_binary(to_bitmap(1)));
```

结果为：

```text
+--------------------------------------------------+
| to_base64_binary(bitmap_to_binary(to_bitmap(1))) |
+--------------------------------------------------+
| BQEBAAAAAAAAAA==                                 |
+--------------------------------------------------+
```

将包含多个元素的 Bitmap 转化为二进制形式，通过 `to_base64_binary` 展示：

```sql
select to_base64_binary(bitmap_to_binary(bitmap_from_string("1,9999999")));
```

结果为：

```text
+---------------------------------------------------------------------+
| to_base64_binary(bitmap_to_binary(bitmap_from_string("1,9999999"))) |
+---------------------------------------------------------------------+
| BQIBAAAAAAAAAH+WmAAAAAAA                                            |
+---------------------------------------------------------------------+
```

与 `bitmap_from_binary` 往返转换后，Bitmap 内容保持不变：

```sql
select bitmap_to_string(bitmap_from_binary(bitmap_to_binary(bitmap_from_string("0, 1, 2, 3, 4294967296"))));
```

结果为：

```text
+------------------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_from_binary(bitmap_to_binary(bitmap_from_string("0, 1, 2, 3, 4294967296")))) |
+------------------------------------------------------------------------------------------------------+
| 0,1,2,3,4294967296                                                                                   |
+------------------------------------------------------------------------------------------------------+
```
