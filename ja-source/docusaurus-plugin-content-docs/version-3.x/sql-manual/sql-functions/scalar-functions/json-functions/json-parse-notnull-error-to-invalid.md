---
{
  "title": "JSON_PARSE_NOTNULL_ERROR_TO_INVALID",
  "description": "この関数はJSON文字列を解析するために使用されます。JSON文字列が不正な形式であるか、解析エラーが発生した場合、",
  "language": "ja"
}
---
## 説明

この関数はJSON文字列を解析するために使用されます。JSON文字列が不正な形式であるか解析エラーが発生した場合、関数は無効なJSONオブジェクト（通常は`{}`）を返します。この関数の主な目的は、JSON形式エラーが発生した際に安全なデフォルト値を返し、解析エラーによるクエリの失敗を防ぐことです。

## エイリアス

- JSONB_PARSE_NOTNULL_ERROR_TO_INVALID

## 構文

```sql
JSON_PARSE_NOTNULL_ERROR_TO_INVALID( <str> )
```
## 必須パラメータ

| parameters| described|
|------|------|
| `<str>`| パースされるJSON文字列。このパラメータは、JSON形式のデータを含む有効な文字列である必要があります。JSON形式が無効な場合、この関数は無効なJSONオブジェクトを返します。 |

## 戻り値
無効なJSONオブジェクト（通常は `{}`）を返します。

## 例

```sql

SELECT JSON_PARSE_NOTNULL_ERROR_TO_INVALID('{"name": "Alice", "age": 30}') AS parsed_json;

```
```sql
+---------------------------+
| parsed_json               |
+---------------------------+
| {"name":"Alice","age":30} |
+---------------------------+

```
