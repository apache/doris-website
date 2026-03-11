---
{
  "title": "JSON_PARSE_NULLABLE_ERROR_TO_VALUE",
  "description": "JSONPARSENULLABLEERRORTOVALUE関数は、JSON文字列を有効なJSONオブジェクトに解析するために使用されます。入力されたJSON文字列が無効な場合、",
  "language": "ja"
}
---
## 説明

`JSON_PARSE_NULLABLE_ERROR_TO_VALUE`関数は、JSON文字列を有効なJSONオブジェクトに解析するために使用されます。入力されたJSON文字列が無効な場合、エラーを投げる代わりに、ユーザーが指定したデフォルト値を返します。入力が`NULL`の場合、デフォルト値を返します。

## 構文

```sql
JSON_PARSE_NULLABLE_ERROR_TO_VALUE( <str> , <default_value>)
```
## エイリアス
- JSONB_PARSE_NULLABLE_ERROR_TO_VALUE

## 必須パラメータ

| パラメータ| 説明|
|------|------|
| `<str>` | 解析対象のJSON形式の入力文字列 |
| `<default_value>` | 解析が失敗した場合に返されるデフォルト値 |

## 戻り値
入力文字列が有効なJSONの場合、対応するJSONオブジェクトを返します。
入力文字列が無効またはNULLの場合、default_valueパラメータで指定されたデフォルト値を返します。

## 例

1. 有効なJSON文字列：

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_VALUE('{"name": "John", "age": 30}', 'default');
```
```sql
+------------------------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_VALUE('{"name": "John", "age": 30}', 'default') |
+------------------------------------------------------------------------------+
| {"name": "John", "age": 30}                                                  |
+------------------------------------------------------------------------------+
```
2. 無効なJSON文字列:

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_VALUE('{"name": "John", "age": }', 'default');
```
```sql
+----------------------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_VALUE('{"name": "John", "age": }', 'default') |
+----------------------------------------------------------------------------+
| default                                                                    |
+----------------------------------------------------------------------------+
```
3. 入力がNULLの場合：

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_VALUE(NULL, 'default');
```
```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_VALUE(NULL, 'default')           |
+---------------------------------------------------------------+
| default                                                       |
+---------------------------------------------------------------+
```
