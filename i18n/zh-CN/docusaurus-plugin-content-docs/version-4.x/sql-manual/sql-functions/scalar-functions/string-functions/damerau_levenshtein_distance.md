---
{
    "title": "DAMERAU_LEVENSHTEIN_DISTANCE",
    "language": "zh-CN",
    "description": "DAMERAU_LEVENSHTEIN_DISTANCE 函数用于计算两个字符串之间的 Damerau-Levenshtein 编辑距离。"
}
---

## 描述

`DAMERAU_LEVENSHTEIN_DISTANCE` 函数用于计算两个字符串之间的 [Damerau-Levenshtein 编辑距离](https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance)。

Damerau-Levenshtein 编辑距离表示将一个字符串转换为另一个字符串所需的最少单字符编辑次数。支持的编辑操作包括：

- 插入一个字符
- 删除一个字符
- 替换一个字符
- 交换两个相邻字符

与 `LEVENSHTEIN` 相比，`DAMERAU_LEVENSHTEIN_DISTANCE` 将相邻字符交换视为一次编辑操作，因此更适合处理由于字符顺序颠倒造成的输入错误。例如，`abcd` 与 `abdc` 之间只需要交换相邻的 `c` 和 `d`，Damerau-Levenshtein 距离为 1，而 Levenshtein 距离为 2。

该函数按 UTF-8 字符计算距离，而不是按字节计算。因此，多字节字符（例如中文字符）会被视为一个字符。

:::note
Since 4.1.3
:::

## 语法

```sql
DAMERAU_LEVENSHTEIN_DISTANCE(<str1>, <str2>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<str1>` | 第一个字符串。类型：VARCHAR |
| `<str2>` | 第二个字符串。类型：VARCHAR |

## 返回值

返回 INT 类型，表示两个字符串之间的 Damerau-Levenshtein 编辑距离。

特殊情况：

- 如果任意参数为 NULL，返回 NULL。
- 如果两个字符串相同，返回 0。
- 如果其中一个字符串为空字符串，返回另一个字符串的字符数。
- 该函数满足交换律，即 `DAMERAU_LEVENSHTEIN_DISTANCE(a, b)` 与 `DAMERAU_LEVENSHTEIN_DISTANCE(b, a)` 返回相同结果。
- 当输入过大导致内部距离矩阵超过限制时，函数会返回错误。

## 示例

1. 基本用法

```sql
SELECT damerau_levenshtein_distance('kitten', 'sitting');
```

```text
+---------------------------------------------------+
| damerau_levenshtein_distance('kitten', 'sitting') |
+---------------------------------------------------+
|                                                 3 |
+---------------------------------------------------+
```

2. 相邻字符交换

```sql
SELECT damerau_levenshtein_distance('abcd', 'abdc');
```

```text
+----------------------------------------------+
| damerau_levenshtein_distance('abcd', 'abdc') |
+----------------------------------------------+
|                                            1 |
+----------------------------------------------+
```

`abcd` 可以通过交换相邻的 `c` 和 `d` 变为 `abdc`，因此距离为 1。

3. 与 `LEVENSHTEIN` 的差异

```sql
SELECT levenshtein('abcd', 'abdc'), damerau_levenshtein_distance('abcd', 'abdc');
```

```text
+-----------------------------+----------------------------------------------+
| levenshtein('abcd', 'abdc') | damerau_levenshtein_distance('abcd', 'abdc') |
+-----------------------------+----------------------------------------------+
|                           2 |                                            1 |
+-----------------------------+----------------------------------------------+
```

`LEVENSHTEIN` 不支持交换操作，因此需要 2 次编辑；`DAMERAU_LEVENSHTEIN_DISTANCE` 支持相邻交换，因此只需要 1 次编辑。

4. UTF-8 字符

```sql
SELECT damerau_levenshtein_distance('你好', '好你');
```

```text
+--------------------------------------------------+
| damerau_levenshtein_distance('你好', '好你')     |
+--------------------------------------------------+
|                                                1 |
+--------------------------------------------------+
```

`你` 和 `好` 是两个 UTF-8 字符，交换相邻字符需要 1 次编辑。

5. 插入、删除、替换

```sql
SELECT
    damerau_levenshtein_distance('', 'abc'),
    damerau_levenshtein_distance('数据库', '数据'),
    damerau_levenshtein_distance('flaw', 'lawn');
```

```text
+-----------------------------------------+-----------------------------------------------------+----------------------------------------------+
| damerau_levenshtein_distance('', 'abc') | damerau_levenshtein_distance('数据库', '数据')      | damerau_levenshtein_distance('flaw', 'lawn') |
+-----------------------------------------+-----------------------------------------------------+----------------------------------------------+
|                                       3 |                                                   1 |                                            2 |
+-----------------------------------------+-----------------------------------------------------+----------------------------------------------+
```

6. 完整 Damerau-Levenshtein 距离示例

```sql
SELECT damerau_levenshtein_distance('CA', 'ABC');
```

```text
+-------------------------------------------+
| damerau_levenshtein_distance('CA', 'ABC') |
+-------------------------------------------+
|                                         2 |
+-------------------------------------------+
```

该函数计算完整 Damerau-Levenshtein 距离。对于 `CA` 和 `ABC`，最少编辑次数为 2。

7. NULL 参数

```sql
SELECT damerau_levenshtein_distance(NULL, 'abc'), damerau_levenshtein_distance('abc', NULL);
```

```text
+-------------------------------------------+-------------------------------------------+
| damerau_levenshtein_distance(NULL, 'abc') | damerau_levenshtein_distance('abc', NULL) |
+-------------------------------------------+-------------------------------------------+
|                                      NULL |                                      NULL |
+-------------------------------------------+-------------------------------------------+
```

8. 输入过大

```sql
SELECT damerau_levenshtein_distance(repeat('a', 4096), repeat('b', 4096));
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]damerau_levenshtein_distance distance matrix is too large: 16793604 cells exceeds limit 16777216
```
