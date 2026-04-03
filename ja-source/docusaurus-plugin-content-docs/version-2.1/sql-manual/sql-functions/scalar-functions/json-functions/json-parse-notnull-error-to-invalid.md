---
{
  "title": "JSON_PARSE_NOTNULL_ERROR_TO_INVALID",
  "language": "ja",
  "description": "この関数はJSON文字列を解析するために使用されます。JSON文字列が不正な形式であるか、解析エラーが発生した場合、"
}
---
## 説明

この関数は、JSON文字列を解析するために使用されます。JSON文字列が不正な形式であるか、解析エラーが発生した場合、この関数は無効なJSONオブジェクト（通常は`{}`）を返します。この関数の主な目的は、JSON形式エラーが発生した際に安全なデフォルト値を返すことで、解析エラーによるクエリの失敗を防ぐことです。

## 別名

- JSONB_PARSE_NOTNULL_ERROR_TO_INVALID

## 構文

```sql
JSON_PARSE_NOTNULL_ERROR_TO_INVALID( <str> )
```
## 必須パラメータ

| parameters| described|
|------|------|
| `<str>`| 解析される JSON 文字列。このパラメータは JSON 形式のデータを含む有効な文字列である必要があります。JSON 形式が無効な場合、関数は無効な JSON オブジェクトを返します。|

## 戻り値
無効な JSON オブジェクト（通常は `{}`）を返します。

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
