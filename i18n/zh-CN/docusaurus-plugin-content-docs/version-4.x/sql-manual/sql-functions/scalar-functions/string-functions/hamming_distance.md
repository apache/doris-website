---
title: HAMMING_DISTANCE
---

::: note
Since 4.1.2
:::

## 描述

`HAMMING_DISTANCE` 函数用于返回两个字符串在对应位置上不同字符的个数。

该函数按 UTF-8 字符而不是字节进行比较。两个输入字符串必须具有相同的 UTF-8 字符数。比较过程区分大小写。

## 语法

```sql
HAMMING_DISTANCE(<str1>, <str2>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<str1>` | 要比较的第一个字符串。 |
| `<str2>` | 要比较的第二个字符串。 |

## 返回值

返回 BIGINT，表示两个字符串在相同位置上不同字符的数量。

特殊情况：

- 任意参数为 NULL 时，返回 NULL。
- 两个参数都为空字符串时，返回 0。
- 两个字符串的 UTF-8 字符数不一致时，返回错误。

## 示例

1. 比较两个长度相同的 ASCII 字符串。

```sql
SELECT hamming_distance('karolin', 'kathrin') AS distance;
```

```text
+----------+
| distance |
+----------+
|        3 |
+----------+
```

2. 比较两个 UTF-8 字符串。两个字符串的字符数相同，只有一个字符不同。

```sql
SELECT hamming_distance('数据库', '数据仓') AS distance;
```

```text
+----------+
| distance |
+----------+
|        1 |
+----------+
```

3. 比较仅大小写不同的字符串。

```sql
SELECT hamming_distance('Doris', 'doris') AS distance;
```

```text
+----------+
| distance |
+----------+
|        1 |
+----------+
```

4. 输入 NULL 时返回 NULL。

```sql
SELECT hamming_distance(NULL, 'abc') AS distance;
```

```text
+----------+
| distance |
+----------+
|     NULL |
+----------+
```
