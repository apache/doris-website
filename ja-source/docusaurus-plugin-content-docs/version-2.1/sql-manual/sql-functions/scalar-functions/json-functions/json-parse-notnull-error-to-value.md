---
{
  "title": "JSON_PARSE_NOTNULL_ERROR_TO_VALUE",
  "language": "ja",
  "description": "JSON文字列を解析する関数です。JSON文字列の形式が無効であるか、解析エラーが発生した場合、"
}
---
## 説明

JSON文字列を解析する関数です。JSON文字列の形式が無効であるか、解析エラーが発生した場合、この関数は無効なJSONオブジェクトを返す代わりに、ユーザーが指定したデフォルト値を返します。この関数の主な目的は、解析エラーが発生した場合に無効な結果を置き換えるために使用できるデフォルト値を提供し、クエリが適切な値を返すことを保証することです。

## 構文

```sql
JSON_PARSE_NOTNULL_ERROR_TO_VALUE(< str >, <default_value>)
```
## Alias

- JSONB_PARSE_NOTNULL_ERROR_TO_VALUE

## 必須パラメータ

| parameters| described|
|------|------|
| `<str>` | 解析するJSON文字列。このパラメータは有効なJSON文字列である必要があります。JSONフォーマットが無効な場合、関数はdefault_valueを返します。 |
| `<default_value>` | 解析エラー時に返されるデフォルト値。このパラメータは任意の型を取ることができ、無効なJSONフォーマットデータを置換するために使用されます。 |


## 戻り値

JSONオブジェクトを返します。入力JSON文字列が有効な場合、解析されたJSONオブジェクトが返されます。無効な場合、ユーザーが指定したdefault_valueを返します。


## 例

```sql
SELECT JSON_PARSE_NOTNULL_ERROR_TO_VALUE('{"name": "Alice", "age": 30}', '{"name": "Unknown", "age":  0}') AS parsed_json;

```
```sql
+-------------------------------------------+
| parsed_json                               |
+-------------------------------------------+
| {"name":"Alice","age":30}                 |
+-------------------------------------------+
```
