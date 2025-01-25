---
{
    "title": "MULTI_MATCH_ANY",
    "language": "zh-CN",
    "description": "检查字符串 haystack 是否与 re2 语法中的正则表达式 patterns 相匹配。如果都没有匹配的正则表达式返回 0，否则返回 1。"
}
---

## 描述

返回字符串是否与给定的一组正则表达式匹配。


## 语法

```sql
TINYINT multi_match_any(VARCHAR haystack, ARRAY<VARCHAR> patterns)
```


## 参数

| 参数 | 说明 |
| -- | -- |
| `haystack` | 被检查的字符串 |
| `patterns` | 正则表达式数组 |


## 返回值

如果字符串 `haystack` 匹配 `patterns` 数组中的任意一个正则表达式返回 1，否则返回 0。


## 举例

```sql
mysql> SELECT multi_match_any('Hello, World!', ['hello', '!', 'world']);
+-----------------------------------------------------------+
| multi_match_any('Hello, World!', ['hello', '!', 'world']) |
+-----------------------------------------------------------+
| 1                                                         |
+-----------------------------------------------------------+

mysql> SELECT multi_match_any('abc', ['A', 'bcd']);
+--------------------------------------+
| multi_match_any('abc', ['A', 'bcd']) |
+--------------------------------------+
| 0                                    |
+--------------------------------------+
```

