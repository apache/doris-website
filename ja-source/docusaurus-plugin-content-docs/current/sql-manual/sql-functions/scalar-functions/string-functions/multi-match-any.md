---
{
  "title": "MULTI_MATCH_ANY",
  "language": "ja",
  "description": "文字列haystackがre2構文の正規表現パターンにマッチするかどうかをチェックします。"
}
---
## multi_match_any
### 説明
#### 構文

`TINYINT multi_match_any(VARCHAR haystack, ARRAY<VARCHAR> patterns)`

文字列`haystack`がre2構文の正規表現`patterns`にマッチするかどうかをチェックします。正規表現のいずれにもマッチしない場合は0を返し、いずれかのパターンがマッチする場合は1を返します。

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
