---
{
  "title": "JSON_PARSE_NULLABLE",
  "description": "JSONPARSENULLABLE関数は、JSON文字列を有効なJSONオブジェクトに解析するために使用されます。入力文字列が無効またはNULLの場合、",
  "language": "ja"
}
---
## 説明

`JSON_PARSE_NULLABLE`関数は、JSON文字列を有効なJSONオブジェクトに解析するために使用されます。入力文字列が無効またはNULLの場合、エラーをスローすることなくNULLを返します。

## 構文

```sql
JSON_PARSE_NULLABLE( <str> )

```
## Alias

- JSONB_PARSE_NULLABLE

## 必須パラメータ

| パラメータ | 説明 |
|------|------|
| `<str>` | パースするJSON形式の入力文字列。 |

## 戻り値
- 入力文字列が有効なJSONの場合、対応するJSONオブジェクトを返します。
- 入力文字列が無効またはNULLの場合、NULLを返します。

## 例

1.有効なJSON文字列:

```sql
SELECT JSON_PARSE_NULLABLE('{"name": "John", "age": 30}');
```
```sql
+-------------------------------------------------------+
| JSON_PARSE_NULLABLE('{"name": "John", "age": 30}')    |
+-------------------------------------------------------+
| {"name": "John", "age": 30}                           |
+-------------------------------------------------------+

```
2.無効なJSON文字列:

```sql
SELECT JSON_PARSE_NULLABLE('{"name": "John", "age": }');
```
```sql
+-------------------------------------------------------+
| JSON_PARSE_NULLABLE('{"name": "John", "age": }')      |
+-------------------------------------------------------+
| NULL                                                  |
+-------------------------------------------------------+

```
