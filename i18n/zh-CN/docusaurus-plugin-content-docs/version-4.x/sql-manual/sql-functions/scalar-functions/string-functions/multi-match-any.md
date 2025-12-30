---
{
    "title": "MULTI_MATCH_ANY",
    "language": "zh-CN",
    "description": "检查字符串 haystack 是否与 re2 语法中的正则表达式 patterns 相匹配。如果都没有匹配的正则表达式返回 0，否则返回 1。"
}
---

## multi_match_any
## 描述
## 语法

`TINYINT multi_match_any(VARCHAR haystack, ARRAY<VARCHAR> patterns)`


检查字符串 `haystack` 是否与 re2 语法中的正则表达式 `patterns` 相匹配。如果都没有匹配的正则表达式返回 0，否则返回 1。

## 举例

```
mysql> select multi_match_any('Hello, World!', ['hello', '!', 'world']);
+-----------------------------------------------------------+
| multi_match_any('Hello, World!', ['hello', '!', 'world']) |
+-----------------------------------------------------------+
| 1                                                         |
+-----------------------------------------------------------+

mysql> select multi_match_any('abc', ['A', 'bcd']);
+--------------------------------------+
| multi_match_any('abc', ['A', 'bcd']) |
+--------------------------------------+
| 0                                    |
+--------------------------------------+
```
### keywords
    MULTI_MATCH,MATCH,ANY
