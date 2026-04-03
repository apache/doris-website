---
{
  "title": "MULTI_MATCH_ANY",
  "description": "文字列haystackがre2構文の正規表現patternsにマッチするかどうかをチェックします。",
  "language": "ja"
}
---
## multi_match_any
### 説明
#### 構文

`TINYINT multi_match_any(VARCHAR haystack, ARRAY<VARCHAR> patterns)`

文字列 `haystack` が re2 構文の正規表現 `patterns` にマッチするかどうかをチェックします。正規表現のいずれもマッチしない場合は 0 を返し、いずれかのパターンがマッチする場合は 1 を返します。

### 例

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
