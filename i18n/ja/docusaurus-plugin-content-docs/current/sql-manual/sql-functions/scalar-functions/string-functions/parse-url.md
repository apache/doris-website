---
{
    "title": "PARSE_URL",
    "language": "ja",
    "description": "PARSE_URL 関数は主に URL 文字列を解析し、プロトコル、ホスト、パス、クエリパラメータなどの構成要素を抽出するために使用します。"
}
---

## 説明

PARSE_URL 関数は主に URL 文字列を解析し、プロトコル、ホスト、パス、クエリパラメータなどの構成要素を抽出するために使用します。

## 構文

```sql
PARSE_URL( <url>, <name> )
```

## パラメータ

| パラメータ | 説明 |
|----------|------|
| `<url>`  | 解析する URL。 |
| `<name>` | 抽出する部分。指定できる値は `PROTOCOL`、`HOST`、`PATH`、`REF`、`AUTHORITY`、`FILE`、`USERINFO`、`PORT`、`QUERY` です（大文字と小文字は区別しません）。 |

## 戻り値

`<url>` の指定した部分を返します。特殊なケース:

- いずれかのパラメータが NULL の場合、NULL を返します。
- `<name>` に上記以外の無効な値を指定した場合、エラーが発生します。

## 例

```sql
SELECT parse_url ('https://doris.apache.org/', 'HOST');
```

```text
+------------------------------------------------+
| parse_url('https://doris.apache.org/', 'HOST') |
+------------------------------------------------+
| doris.apache.org                               |
+------------------------------------------------+
```

```sql
SELECT parse_url ('https://doris.apache.org/', null);
```

```text
+----------------------------------------------+
| parse_url('https://doris.apache.org/', NULL) |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```

## 関連項目

QUERY から特定のパラメータを抽出するには、[extract_url_parameter](./extract-url-parameter.md) を使用します。
