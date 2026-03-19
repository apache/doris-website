---
{
  "title": "MULTI_SEARCH_ALL_POSITIONS",
  "description": "i番目の要素がneedles（すなわちneedle）のi番目の要素の文字列haystack内での最初の出現位置を表すARRAYを返します。",
  "language": "ja"
}
---
## multi_search_all_positions
### 説明
#### 構文

`ARRAY<INT> multi_search_all_positions(VARCHAR haystack, ARRAY<VARCHAR> needles)`

`ARRAY`を返します。この配列の`i`番目の要素は、`needles`の`i`番目の要素（すなわち`needle`）が文字列`haystack`内で**最初に**出現する位置です。位置は1から数え、0は要素が見つからなかったことを意味します。**大文字小文字を区別します**。

### 例

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
