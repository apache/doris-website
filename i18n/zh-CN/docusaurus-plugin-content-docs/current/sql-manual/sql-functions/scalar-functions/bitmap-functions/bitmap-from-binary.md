---
{
    "title": "BITMAP_FROM_BINARY",
    "language": "zh-CN",
    "description": "将 Doris Bitmap 的二进制序列化字节（VARBINARY）转化为一个 BITMAP，可直接读取 Hive、Parquet、ORC 等外部表中的 binary 列。当输入字节不合法或被截断时，返回 NULL 而不报错。"
}
---

## 描述

将 Doris Bitmap 的二进制序列化字节转化为一个 BITMAP。输入为 VARBINARY 类型的值，字节格式可由 `bitmap_to_binary` 生成，也可以是 Doris Hive UDF 包中的 Hive UDF（`to_bitmap` / `bitmap_union`）生成的字节，或 Spark Load 生成的字节。当输入字节不合法或被截断时，返回 NULL。

## 语法

```sql
BITMAP_FROM_BINARY(<binary>)
```

## 参数

| 参数        | 描述                                                                                                        |
|-----------|--------------------------------------------------------------------------------------------------------------|
| `<binary>` | 包含 Doris Bitmap 序列化字节的 VARBINARY 值，例如通过 Catalog 读取的 Hive `binary` 列，或 `bitmap_to_binary` 的输出 |

## 返回值

返回一个 BITMAP。
当输入字节不合法或被截断时（例如类型码未知、负载被截断、输入为空），返回 NULL。

## 举例

转换 `NULL` 输入：

```sql
select bitmap_to_string(bitmap_from_binary(null));
```

结果为：

```text
+--------------------------------------------+
| bitmap_to_string(bitmap_from_binary(null)) |
+--------------------------------------------+
| NULL                                       |
+--------------------------------------------+
```

转换空 Bitmap 的二进制形式（空 Bitmap 的字节可通过 `bitmap_to_binary(bitmap_empty())` 生成）：

```sql
select bitmap_to_string(bitmap_from_binary(bitmap_to_binary(bitmap_empty())));
```

结果为：

```text
+------------------------------------------------------------------------+
| bitmap_to_string(bitmap_from_binary(bitmap_to_binary(bitmap_empty()))) |
+------------------------------------------------------------------------+
|                                                                        |
+------------------------------------------------------------------------+
```

转换包含单个元素的 Bitmap 的二进制形式：

```sql
select bitmap_to_string(bitmap_from_binary(bitmap_to_binary(to_bitmap(1))));
```

结果为：

```text
+----------------------------------------------------------------------+
| bitmap_to_string(bitmap_from_binary(bitmap_to_binary(to_bitmap(1)))) |
+----------------------------------------------------------------------+
| 1                                                                    |
+----------------------------------------------------------------------+
```

转换包含多个元素的 Bitmap 的二进制形式：

```sql
select bitmap_to_string(bitmap_from_binary(bitmap_to_binary(bitmap_from_string("0, 1, 2, 3"))));
```

结果为：

```text
+------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_from_binary(bitmap_to_binary(bitmap_from_string("0, 1, 2, 3")))) |
+------------------------------------------------------------------------------------------+
| 0,1,2,3                                                                                  |
+------------------------------------------------------------------------------------------+
```

支持包含超出 32 位范围的值的 Bitmap：

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

不合法或被截断的字节返回 `NULL`，而不会报错：

```sql
select bitmap_to_string(bitmap_from_binary(sub_binary(bitmap_to_binary(to_bitmap(1)), 1, 3)));
```

结果为：

```text
+----------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_from_binary(sub_binary(bitmap_to_binary(to_bitmap(1)), 1, 3))) |
+----------------------------------------------------------------------------------------+
| NULL                                                                                   |
+----------------------------------------------------------------------------------------+
```
