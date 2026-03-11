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

文字列`haystack`がre2構文の正規表現`patterns`と一致するかどうかを確認します。正規表現のいずれも一致しない場合は0を返し、いずれかのパターンが一致する場合は1を返します。

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
