---
{
    "title": "URL_DECODE",
    "language": "ja",
    "description": "URL をデコードした文字列に変換します。"
}
---

## 説明

URL をデコードした文字列に変換します。

## 構文

```sql
URL_DECODE( <str> )
```

## 必須パラメータ
| パラメータ | 説明 |
|------|------|
| `<str>` | デコードする文字列。URL が文字列型ではない場合。 |

##  戻り値

デコード後の値

##  例

パーセントエンコードされた URL をデコードします — `%3A` は `:` に、`%2F` は `/` に変換されます。

```sql
select url_decode('https%3A%2F%2Fdoris.apache.org%2Fzh-CN%2Fdocs%2Fsql-manual%2Fsql-functions%2Fstring-functions');
```

```text
+-------------------------------------------------------------------------------------------------------------+
| url_decode('https%3A%2F%2Fdoris.apache.org%2Fzh-CN%2Fdocs%2Fsql-manual%2Fsql-functions%2Fstring-functions') |
+-------------------------------------------------------------------------------------------------------------+
| https://doris.apache.org/zh-CN/docs/sql-manual/sql-functions/string-functions                               |
+-------------------------------------------------------------------------------------------------------------+
```

`application/x-www-form-urlencoded` 形式の文字列をデコードします — `+` は空白に、`%26` は `&` に変換されます。

```sql
select url_decode('Doris+Q%26A');
```

```text
+---------------------------+
| url_decode('Doris+Q%26A') |
+---------------------------+
| Doris Q&A                 |
+---------------------------+
```
