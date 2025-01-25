---
{
    "title": "MULTI_SEARCH_ALL_POSITIONS",
    "language": "zh-CN"
}
---

## 描述

返回一组正则表达式在一个字符串中首次出现的位置。


## 语法

```sql
ARRAY<INT> multi_search_all_positions(VARCHAR haystack, ARRAY<VARCHAR> patterns)
```


## 参数

| 参数 | 说明 |
| -- | -- |
| `haystack` | 被检查的字符串 |
| `patterns` | 正则表达式数组 |


## 返回值

返回一个 `ARRAY`，其中第 `i` 个元素为 `patterns` 数组中第 `i` 个元素（正则表达式），在字符串 `haystack` 中**首次**出现的位置，位置从 1 开始计数，0 代表未找到该元素。


## 举例

```sql
mysql> SELECT multi_search_all_positions('Hello, World!', ['hello', '!', 'world']);
+----------------------------------------------------------------------+
| multi_search_all_positions('Hello, World!', ['hello', '!', 'world']) |
+----------------------------------------------------------------------+
| [0, 13, 0]                                                             |
+----------------------------------------------------------------------+

mysql> SELECT multi_search_all_positions("Hello, World!", ['hello', '!', 'world', 'Hello', 'World']);
+---------------------------------------------------------------------------------------------+
| multi_search_all_positions('Hello, World!', ARRAY('hello', '!', 'world', 'Hello', 'World')) |
+---------------------------------------------------------------------------------------------+
| [0, 13, 0, 1, 8]                                                                            |
+---------------------------------------------------------------------------------------------+
```
