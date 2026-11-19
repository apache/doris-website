---
{
    "title": "ORD/UNICODE",
    "language": "zh-CN",
    "description": "返回 UTF-8 字符串中首个字符的 Unicode 码点，返回类型为 INT。UNICODE 是 ORD 的别名。"
}
---

## 描述

:::caution 可用性

本文描述 [Doris PR #69027](https://github.com/apache/doris/pull/69027) 提议的行为。该 PR 尚未合入；dev、4.x 和 3.x 均不支持这两个函数。首次支持的发布版本尚未确认。以下示例用于说明提议的行为，暂不能在这些版本上执行。

:::

返回 UTF-8 字符串中首个字符的 Unicode 码点。只解码首个字符。输入为 NULL 时返回 NULL。

## 别名

- UNICODE

## 语法

```sql
ORD(<str>)
UNICODE(<str>)
```

## 参数

| 参数 | 说明 |
|-----------|-------------|
| `<str>` | 需要返回首个 Unicode 码点的字符串。类型为 STRING 或 VARCHAR。 |

## 返回值

返回 INT 类型，表示首个 Unicode 码点对应的十进制整数。

- 输入为 NULL 时，返回 NULL。
- 字符串为空，或首个字符的 UTF-8 编码无效或不完整时，返回 -1。
- 首个字符为 NUL 时，返回 0。
- 首个字符之后的字符和字节不影响结果，即使后续字节不是有效的 UTF-8 编码。

[ASCII](./ascii.md) 返回首个字节的值，ORD 则解码首个 Unicode 字符。

## 示例

ASCII 字符、中文字符和 emoji：

```sql
SELECT ORD('ABC') AS ascii_code, ORD('中text') AS chinese_code, ORD('😀') AS emoji_code;
```

```text
+------------+--------------+------------+
| ascii_code | chinese_code | emoji_code |
+------------+--------------+------------+
|         65 |        20013 |     128512 |
+------------+--------------+------------+
```

UNICODE 别名返回相同结果：

```sql
SELECT ORD('é') AS ord_code, UNICODE('é') AS unicode_code;
```

```text
+----------+--------------+
| ord_code | unicode_code |
+----------+--------------+
|      233 |          233 |
+----------+--------------+
```

空字符串、NULL 输入以及首个字符为 NUL：

```sql
SELECT ORD('') AS empty_code, ORD(NULL) AS null_code, ORD(UNHEX('00')) AS nul_code;
```

```text
+------------+-----------+----------+
| empty_code | null_code | nul_code |
+------------+-----------+----------+
|         -1 |      NULL |        0 |
+------------+-----------+----------+
```

首个字符的 UTF-8 编码无效或不完整时返回 -1。有效首个字符之后的无效字节会被忽略：

```sql
SELECT ORD(UNHEX('FF')) AS invalid_code, ORD(UNHEX('E4BD')) AS incomplete_code,
       ORD(UNHEX('41FF')) AS valid_first_code;
```

```text
+--------------+-----------------+------------------+
| invalid_code | incomplete_code | valid_first_code |
+--------------+-----------------+------------------+
|           -1 |              -1 |               65 |
+--------------+-----------------+------------------+
```
