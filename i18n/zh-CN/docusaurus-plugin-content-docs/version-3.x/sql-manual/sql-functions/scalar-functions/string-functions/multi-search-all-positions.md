---
{
    "title": "MULTI_SEARCH_ALL_POSITIONS",
    "language": "zh-CN",
    "description": "返回一个 ARRAY，其中第 i 个元素为 needles 中第 i 个元素 needle，在字符串 haystack 中首次出现的位置。位置从 1 开始计数，0 代表未找到该元素。大小写敏感。"
}
---

## multi_search_all_positions
## 描述
## 语法

`ARRAY<INT> multi_search_all_positions(VARCHAR haystack, ARRAY<VARCHAR> needles)`

返回一个 `ARRAY`，其中第 `i` 个元素为 `needles` 中第 `i` 个元素 `needle`，在字符串 `haystack` 中**首次**出现的位置。位置从 1 开始计数，0 代表未找到该元素。**大小写敏感**。

## 举例

```
mysql> select multi_search_all_positions('Hello, World!', ['hello', '!', 'world']);
+----------------------------------------------------------------------+
| multi_search_all_positions('Hello, World!', ['hello', '!', 'world']) |
+----------------------------------------------------------------------+
| [0,13,0]                                                             |
+----------------------------------------------------------------------+

select multi_search_all_positions("Hello, World!", ['hello', '!', 'world', 'Hello', 'World']);
+---------------------------------------------------------------------------------------------+
| multi_search_all_positions('Hello, World!', ARRAY('hello', '!', 'world', 'Hello', 'World')) |
+---------------------------------------------------------------------------------------------+
| [0, 13, 0, 1, 8]                                                                            |
+---------------------------------------------------------------------------------------------+
```

### keywords
    MULTI_SEARCH,SEARCH,POSITIONS
