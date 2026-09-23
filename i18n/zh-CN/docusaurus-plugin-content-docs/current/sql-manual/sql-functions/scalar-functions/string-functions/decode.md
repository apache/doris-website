---
{
    "title": "DECODE",
    "language": "zh-CN",
    "description": "DECODE 函数使用指定字符集将 VARBINARY 字节值转换为字符串，支持 US-ASCII、ISO-8859-1、UTF-8、UTF-16BE、UTF-16LE 和 UTF-16。"
}
---

## 描述

使用指定字符集将 `VARBINARY` 值转换为字符串。字符集名称不区分大小写。支持的字符集包括 `US-ASCII`、`ISO-8859-1`、`UTF-8`、`UTF-16BE`、`UTF-16LE` 和 `UTF-16`。

## 语法

```sql
DECODE(<binary>, <charset>)
```

## 参数

| 参数 | 说明 |
| :--- | :--- |
| `<binary>` | 要解码的二进制值。类型：VARBINARY。 |
| `<charset>` | 输入字节所使用的字符集名称的字符串字面量，或 `NULL`。支持的值为 `US-ASCII`、`ISO-8859-1`、`UTF-8`、`UTF-16BE`、`UTF-16LE` 和 `UTF-16`。不允许使用列或其他表达式。 |

## 返回值

返回包含解码后文本的 `STRING` 值。

- `<charset>` 为 `NULL`，或 `<binary>` 为 `NULL` 且 `<charset>` 有效时，返回 `NULL`。
- `<binary>` 为空时，返回空字符串。
- 对于 `UTF-16`，函数识别大端（`FE FF`）和小端（`FF FE`）BOM，并从结果中移除 BOM。没有 BOM 时，按大端解码。`UTF-16BE` 和 `UTF-16LE` 始终使用各自明确的字节序。
- `<charset>` 不受支持时，即使 `<binary>` 为 `NULL`，函数也会返回错误。`<binary>` 对于指定字符集格式不正确时，函数同样返回错误。

## 示例

**解码 UTF-8 字节**

```sql
SELECT DECODE(CAST(UNHEX('E4B8AD') AS VARBINARY), 'UTF-8') AS decoded_text;
```

```text
+--------------+
| decoded_text |
+--------------+
| 中           |
+--------------+
```

**解码带 BOM 的小端 UTF-16 字节**

小写字符集名称同时说明字符集匹配不区分大小写。

```sql
SELECT DECODE(CAST(UNHEX('FFFE2D4E') AS VARBINARY), 'utf-16') AS decoded_text;
```

```text
+--------------+
| decoded_text |
+--------------+
| 中           |
+--------------+
```

**NULL 和空输入**

```sql
SELECT
    DECODE(CAST(NULL AS VARBINARY), 'UTF-8') IS NULL AS null_result,
    DECODE(CAST(UNHEX('') AS VARBINARY), 'UTF-16') = '' AS empty_result;
```

```text
+-------------+--------------+
| null_result | empty_result |
+-------------+--------------+
|           1 |            1 |
+-------------+--------------+
```
