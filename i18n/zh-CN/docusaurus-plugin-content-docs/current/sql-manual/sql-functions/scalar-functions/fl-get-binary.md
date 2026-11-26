---
{
    "title": "FL_GET_BINARY",
    "language": "zh-CN",
    "description": "返回 FILE 值中已存储的二进制内容。"
}
---

## 描述

返回 [FILE](../../basic-element/sql-data-types/semi-structured/FILE.md) 值的 `inline` 字段中已存储的二进制内容。此函数不会访问 URI 或下载远端文件内容。

## 语法

```sql
FL_GET_BINARY(<file>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<file>` | `FILE` 类型的表达式或 `NULL`。传入其他类型的参数会报错。 |

## 返回值

返回类型为可空的 `VARBINARY`。`FILE` 为 `NULL` 或 `inline` 字段为 `NULL` 时，返回 `NULL`。二进制内容长度为零时，返回的二进制值长度也为零。已存储的字节按原样返回，`offset` 和 `size` 不会限定返回的字节范围。

## 示例

输入为 `NULL`：

```sql
SELECT FL_GET_BINARY(NULL) AS binary_value;
```

```text
+--------------+
| binary_value |
+--------------+
| NULL         |
+--------------+
```

概念示例：当上游数据源提供 `FILE` 列 `f` 时读取内联二进制内容（当前版本尚未启用 SQL `FILE` 构造函数与表列）：

```sql
SELECT FROM_BINARY(FL_GET_BINARY(f)) AS inline_hex
FROM file_source;
```

```text
+------------+
| inline_hex |
+------------+
| 00FF80     |
+------------+
```
