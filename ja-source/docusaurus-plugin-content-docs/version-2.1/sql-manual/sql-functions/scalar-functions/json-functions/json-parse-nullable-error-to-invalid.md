---
{
  "title": "JSON_PARSE_NULLABLE_ERROR_TO_INVALID",
  "language": "ja",
  "description": "JSONPARSENULLABLEERRORTOINVALID関数は、JSON文字列を有効なJSONオブジェクトに解析するために使用されます。入力されたJSON文字列が無効な場合、"
}
---
## 説明

`JSON_PARSE_NULLABLE_ERROR_TO_INVALID`関数は、JSON文字列を有効なJSONオブジェクトに解析するために使用されます。入力されたJSON文字列が無効な場合、エラーをスローすることなく、「無効なJSON」マーカー（通常は`INVALID_JSON`）を返します。入力が`NULL`の場合も、`INVALID_JSON`マーカーを返します。

## 構文

```sql
JSON_PARSE_NULLABLE_ERROR_TO_INVALID( <str> )
```
## エイリアス

- JSONB_PARSE_NULLABLE_ERROR_TO_INVALID


## 必須パラメータ

| パラメータ | 説明                                             |
|-----------|---------------------------------------------------------|
| `<str>`   | 解析対象のJSON形式の入力文字列。           |

## 戻り値

| 条件                               | 戻り値                       |
|-----------------------------------------|------------------------------------|
| 入力文字列が有効なJSONの場合     | 対応するJSONオブジェクトを返します。 |
| 入力文字列が無効またはNULLの場合  | `INVALID_JSON`マーカーを返します。 |

## 例
1. 有効なJSON文字列:

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_INVALID('{"name": "John", "age": 30}');
```
```sql
+----------------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_INVALID('{"name": "John", "age": 30}')  |
+----------------------------------------------------------------------+
| {"name": "John", "age": 30}                                          |
+----------------------------------------------------------------------+
```
2. 無効なJSON文字列：

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_INVALID('{"name": "John", "age": }');
```
```sql
+-------------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_INVALID('{"name": "John", "age": }') |
+-------------------------------------------------------------------+
| INVALID_JSON                                                      |
+-------------------------------------------------------------------+
```
3. 入力がNULLの場合：

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_INVALID(NULL);
```
```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_INVALID(NULL)                    |
+---------------------------------------------------------------+
| INVALID_JSON                                                  |
+---------------------------------------------------------------+
```
