---
{
    "title": "MULTI_MATCH_ANY",
    "language": "zh-CN",
    "description": "检查字符串是否匹配正则表达式数组中的任意一个表达式。"
}
---

<a id="multi_match_any"></a>

## 描述

检查 `<haystack>` 是否匹配 `<patterns>` 中的任意一个正则表达式。默认区分大小写。任一参数为 `NULL` 时返回 `0`，不会返回 `NULL`。

## 语法

```sql
MULTI_MATCH_ANY(<haystack>, <patterns>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<haystack>` | 要匹配的字符串，类型为 `STRING`。 |
| `<patterns>` | 正则表达式数组，类型为 `ARRAY<STRING>`。表达式元素应为非 NULL 字符串。 |

## 返回值

返回 `TINYINT`：任一表达式匹配时为 `1`，否则为 `0`。空表达式数组返回 `0`；任一参数为 `NULL` 时也返回 `0`。

该函数使用 Hyperscan/VectorScan 正则引擎。非法或该引擎不支持的表达式会报错。常量字符串不能与非常量表达式数组列组合；这种组合会返回参数错误。

## 示例 {#举例}

```sql
SELECT multi_match_any('Hello, World!', ['hello', '!', 'world']) AS matched;
```

```text
1
```

```sql
SELECT multi_match_any('abc', ['A', 'bcd']) AS matched;
```

```text
0
```

正则表达式会执行模式匹配，而不是按字面值查找子串：

```sql
SELECT multi_match_any('abc123', ['[0-9]+', '^xyz']) AS matched;
```

```text
1
```

```sql
SELECT multi_match_any('abc', CAST([] AS ARRAY<STRING>)) AS empty_patterns,
       multi_match_any(CAST(NULL AS STRING), ['a']) AS null_text,
       multi_match_any('abc', CAST(NULL AS ARRAY<STRING>)) AS null_patterns;
```

```text
0    0    0
```

## keywords

MULTI_MATCH, MATCH, ANY
