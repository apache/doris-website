---
{
    "title": "ENCODE",
    "language": "zh-CN",
    "description": "ENCODE 函数使用指定字符集将字符串转换为 VARBINARY 字节值，支持 US-ASCII、ISO-8859-1、UTF-8、UTF-16BE、UTF-16LE 和 UTF-16。"
}
---

## 描述

使用指定字符集将字符串转换为 `VARBINARY` 值。字符集名称不区分大小写。支持的字符集包括 `US-ASCII`、`ISO-8859-1`、`UTF-8`、`UTF-16BE`、`UTF-16LE` 和 `UTF-16`。

## 语法

```sql
ENCODE(<source>, <charset>)
```

## 参数

| 参数 | 说明 |
| :--- | :--- |
| `<source>` | 要编码的字符串。类型：STRING。 |
| `<charset>` | 目标字符集名称。类型：STRING。支持的值为 `US-ASCII`、`ISO-8859-1`、`UTF-8`、`UTF-16BE`、`UTF-16LE` 和 `UTF-16`。 |

## 返回值

返回包含编码后字节的 `VARBINARY` 值。

- 任一参数为 `NULL` 时，返回 `NULL`。
- `<source>` 为空字符串时，返回空的二进制值。
- 对于非空输入，`UTF-16` 会写入大端字节序标记（BOM）。`UTF-16BE` 和 `UTF-16LE` 不写入 BOM。
- `<charset>` 不受支持，或 `<source>` 包含无法用目标字符集表示的字符时，函数返回错误。

## 示例

**使用 UTF-8 和 ISO-8859-1 编码同一个字符**

使用 `HEX` 显示返回的二进制字节。

```sql
SELECT
    HEX(ENCODE('é', 'UTF-8')) AS utf8_bytes,
    HEX(ENCODE('é', 'ISO-8859-1')) AS latin1_bytes;
```

```text
+------------+--------------+
| utf8_bytes | latin1_bytes |
+------------+--------------+
| C3A9       | E9           |
+------------+--------------+
```

**比较 UTF-16 的不同形式**

```sql
SELECT
    HEX(ENCODE('中', 'UTF-16BE')) AS big_endian,
    HEX(ENCODE('中', 'UTF-16LE')) AS little_endian,
    HEX(ENCODE('中', 'UTF-16')) AS with_bom;
```

```text
+------------+---------------+----------+
| big_endian | little_endian | with_bom |
+------------+---------------+----------+
| 4E2D       | 2D4E          | FEFF4E2D |
+------------+---------------+----------+
```

**NULL 和空输入**

```sql
SELECT
    ENCODE(NULL, 'UTF-8') IS NULL AS null_result,
    HEX(ENCODE('', 'UTF-16')) = '' AS empty_result;
```

```text
+-------------+--------------+
| null_result | empty_result |
+-------------+--------------+
|           1 |            1 |
+-------------+--------------+
```
