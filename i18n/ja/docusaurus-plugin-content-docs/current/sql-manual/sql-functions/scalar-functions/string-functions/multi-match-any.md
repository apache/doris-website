---
{
    "title": "MULTI_MATCH_ANY",
    "language": "ja",
    "description": "文字列 haystack が RE2 構文の正規表現 patterns に一致するかどうかを確認します。"
}
---

## multi_match_any
### 説明
#### 構文

`TINYINT multi_match_any(VARCHAR haystack, ARRAY<VARCHAR> patterns)`


文字列 `haystack` が RE2 構文の正規表現 `patterns` に一致するかどうかを確認します。どの正規表現にも一致しない場合は 0、いずれかのパターンに一致する場合は 1 を返します。

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
### キーワード
    MULTI_MATCH,MATCH,ANY
