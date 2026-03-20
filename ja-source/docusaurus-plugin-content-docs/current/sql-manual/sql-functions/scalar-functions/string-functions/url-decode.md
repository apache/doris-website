---
{
  "title": "URL_DECODE",
  "language": "ja",
  "description": "URLを復号化された文字列に変換します。"
}
---
## 説明

urlをデコードされた文字列に変換します。

## 構文

```sql
URL_DECODE( <str> )
```
## 必須パラメータ
| パラメータ | 説明 |
|------|------|
| `<str>` | デコードする文字列。urlが文字列型でない場合。 |

## 戻り値

デコードされた値

## 例

```sql
select url_decode('https%3A%2F%2Fdoris.apache.org%2Fzh-CN%2Fdocs%2Fsql-manual%2Fsql-functions%2Fstring-functions');
```
```sql
+------------------------------------------------+
| url_decode('https%3A%2F%2Fdoris.apache.org%2Fzh-CN%2Fdocs%2Fsql-manual%2Fsql-functions%2Fstring-functions') |
+------------------------------------------------+
| https://doris.apache.org/zh-CN/docs/sql-manual/sql-functions/string-functions                               |
+------------------------------------------------+
```
