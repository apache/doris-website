---
{
  "title": "URL_DECODE",
  "description": "urlを復号化された文字列に変換します。",
  "language": "ja"
}
---
## デスクリプション

urlをデコード文字列に変換します。

## Syntax

```sql
URL_DECODE( <str> )
```
## Required パラメータ
| パラメータ | デスクリプション |
|------|------|
| `<str>` | デコードする文字列。urlが文字列型でない場合。 |

## Return Value

デコードされた値

## Example

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
