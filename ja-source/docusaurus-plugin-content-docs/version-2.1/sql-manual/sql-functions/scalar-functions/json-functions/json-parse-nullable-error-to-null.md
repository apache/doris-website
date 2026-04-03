---
{
  "title": "JSON_PARSE_NULLABLE_ERROR_TO_NULL",
  "language": "ja",
  "description": "JSONPARSENULLABLEERRORTONULL関数は、JSON文字列を有効なJSONオブジェクトに解析するために使用されます。入力されたJSON文字列が無効な場合、"
}
---
## 説明

`JSON_PARSE_NULLABLE_ERROR_TO_NULL`関数は、JSON文字列を有効なJSONオブジェクトに解析するために使用されます。入力されたJSON文字列が無効な場合、エラーを発生させることなく`NULL`を返します。入力が`NULL`の場合、直接`NULL`を返します。

## 構文

```sql
JSON_PARSE_NULLABLE_ERROR_TO_NULL( <str> )
```
## エイリアス

- JSONB_PARSE_NULLABLE_ERROR_TO_NULL

## 必須パラメータ

| パラメータ | 説明                                             |
|-----------|--------------------------------------------------|
| `<str>`   | パースするJSON形式の入力文字列。                    |

## 戻り値

入力文字列が有効なJSONの場合、対応するJSONオブジェクトを返します。
入力文字列が無効またはNULLの場合、NULLを返します。

## 例

1. 有効なJSON文字列:

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_NULL('{"name": "John", "age": 30}');

```
```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_NULL('{"name": "John", "age": 30}') |
+---------------------------------------------------------------+
| {"name": "John", "age": 30}                                    |
+---------------------------------------------------------------+

```
2. 無効なJSON文字列:

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_NULL('{"name": "John", "age": }');

```
```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_NULL('{"name": "John", "age": }') |
+---------------------------------------------------------------+
| NULL                                                          |
+---------------------------------------------------------------+

```
3. 入力がNULLの場合:

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_NULL(NULL);

```
```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_NULL(NULL)                        |
+---------------------------------------------------------------+
| NULL                                                          |
+---------------------------------------------------------------+

```
