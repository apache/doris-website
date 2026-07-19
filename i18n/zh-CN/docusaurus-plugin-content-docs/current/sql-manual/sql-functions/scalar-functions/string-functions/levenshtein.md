---
{
    "title": "LEVENSHTEIN",
    "language": "zh-CN",
    "description": "LEVENSHTEIN 函数用于计算两个字符串之间的 Levenshtein 编辑距离。"
}
---

## 描述

`LEVENSHTEIN` 函数用于计算两个字符串之间的 [Levenshtein 编辑距离](https://en.wikipedia.org/wiki/Edit_distance)。

Levenshtein 编辑距离表示将一个字符串转换为另一个字符串所需的最少单字符编辑次数。支持的编辑操作包括：

- 插入一个字符
- 删除一个字符
- 替换一个字符

该函数按 UTF-8 字符计算距离，而不是按字节计算。因此，多字节字符（例如中文字符）会被视为一个字符。

## 别名

- `LEVENSHTEIN_DISTANCE`
- `EDIT_DISTANCE`

## 语法

```sql
LEVENSHTEIN(<str1>, <str2>)
LEVENSHTEIN_DISTANCE(<str1>, <str2>)
EDIT_DISTANCE(<str1>, <str2>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<str1>` | 第一个字符串。类型：VARCHAR |
| `<str2>` | 第二个字符串。类型：VARCHAR |

## 返回值

返回 INT 类型，表示两个字符串之间的 Levenshtein 编辑距离。

特殊情况：

- 如果任意参数为 NULL，返回 NULL。
- 如果两个字符串相同，返回 0。
- 如果其中一个字符串为空字符串，返回另一个字符串的字符数。
- 该函数满足交换律，即 `LEVENSHTEIN(a, b)` 与 `LEVENSHTEIN(b, a)` 返回相同结果。

## 示例

1. 基本用法

```sql
SELECT levenshtein('kitten', 'sitting');
```

```text
+----------------------------------+
| levenshtein('kitten', 'sitting') |
+----------------------------------+
|                                3 |
+----------------------------------+
```

`kitten` 可以通过 3 次编辑变为 `sitting`：将 `k` 替换为 `s`，将 `e` 替换为 `i`，并在末尾插入 `g`。

2. 字符串相同

```sql
SELECT levenshtein('abc', 'abc');
```

```text
+---------------------------+
| levenshtein('abc', 'abc') |
+---------------------------+
|                         0 |
+---------------------------+
```

3. 空字符串

```sql
SELECT levenshtein('', 'abc'), levenshtein('数据库', '');
```

```text
+------------------------+------------------------------+
| levenshtein('', 'abc') | levenshtein('数据库', '')    |
+------------------------+------------------------------+
|                      3 |                            3 |
+------------------------+------------------------------+
```

4. UTF-8 字符

```sql
SELECT levenshtein('你好世界', '你好世间');
```

```text
+---------------------------------------------+
| levenshtein('你好世界', '你好世间')         |
+---------------------------------------------+
|                                           1 |
+---------------------------------------------+
```

`界` 替换为 `间` 需要 1 次编辑。

5. 相邻字符交换会按两次编辑计算

```sql
SELECT levenshtein('abcd', 'abdc');
```

```text
+-----------------------------+
| levenshtein('abcd', 'abdc') |
+-----------------------------+
|                           2 |
+-----------------------------+
```

Levenshtein 距离不把相邻字符交换作为单独操作，因此 `abcd` 与 `abdc` 的距离为 2。

6. 使用别名

```sql
SELECT levenshtein_distance('abcd', 'abdc'), edit_distance('kitten', 'sitting');
```

```text
+--------------------------------------+------------------------------------+
| levenshtein_distance('abcd', 'abdc') | edit_distance('kitten', 'sitting') |
+--------------------------------------+------------------------------------+
|                                    2 |                                  3 |
+--------------------------------------+------------------------------------+
```

7. NULL 参数

```sql
SELECT levenshtein(NULL, 'abc'), levenshtein('abc', NULL);
```

```text
+--------------------------+--------------------------+
| levenshtein(NULL, 'abc') | levenshtein('abc', NULL) |
+--------------------------+--------------------------+
|                     NULL |                     NULL |
+--------------------------+--------------------------+
```
