---
{
  "title": "JSON_PARSE",
  "description": "元のJSON文字列をJSONバイナリ形式に解析します。異なる異常データ処理のニーズを満たすために、",
  "language": "ja"
}
---
## 説明
元のJSON文字列をJSONバイナリ形式に解析します。異なる異常データ処理のニーズを満たすため、以下のようにさまざまなJSON_PARSEシリーズ関数が提供されています：
* JSON_PARSE: JSON文字列を解析し、入力文字列が有効なJSON文字列でない場合はエラーを報告します。
* JSON_PARSE_ERROR_TO_INVALID: JSON文字列を解析し、入力文字列が有効なJSON文字列でない場合はNULLを返します。
* JSON_PARSE_ERROR_TO_NULL: JSON文字列を解析し、入力文字列が有効なJSON文字列でない場合はNULLを返します。
* JSON_PARSE_ERROR_TO_VALUE: JSON文字列を解析し、入力文字列が有効なJSON文字列でない場合はパラメータdefault_json_strで指定されたデフォルト値を返します。
* JSON_PARSE_NOTNULL: JSON文字列を解析し、入力文字列が有効なJSON文字列でない場合はNULLを返します。

## エイリアス
* JSONB_PARSEはJSON_PARSEと同じです
* JSONB_PARSE_ERROR_TO_INVALIDはJSON_PARSE_ERROR_TO_INVALIDと同じです
* JSONB_PARSE_ERROR_TO_NULLはJSON_PARSE_ERROR_TO_NULLと同じです
* JSONB_PARSE_ERROR_TO_VALUEはJSON_PARSE_ERROR_TO_VALUEと同じです
* JSONB_PARSE_NOTNULLはJSON_PARSE_NOTNULLと同じです

## 構文

```sql
JSON_PARSE (<json_str>)
```
```sql
JSON_PARSE_ERROR_TO_INVALID (<json_str>)
```
```sql
JSON_PARSE_ERROR_TO_NULL (<json_str>)
```
```sql
JSON_PARSE_ERROR_TO_VALUE (<json_str>, <default_json_str>)
```
```sql
JSONB_PARSE_NOTNULL (<json_str>)
```
## パラメータ
| パラメータ           | 説明                          |
|--------------|-----------------------------|
| `<json_str>` | 抽出対象のJSONタイプパラメータまたはフィールド。         |
| `<default_json_str>`    | 入力文字列が有効なJSON文字列でない場合、パラメータdefault_json_strで指定されたデフォルト値を返す。 |                                                                                                                     |

## 戻り値
json_parse関数はJSON文字列をバイナリ形式に解析します。例外処理に対する異なる要求を満たすために、一連の関数が提供されています。
- json_strがNULLの場合、すべてNULLを返す
- json_strが有効でない場合
  - json_parseはエラーを報告する
  - json_parse_error_to_invalidはNULLを返す
  - json_parse_error_to_nullはNULLを返す
  - json_parse_error_to_valueはdefault_json_strで指定された値を返す
  - json_parse_notnullはNULLを返す

### 例
1. 有効なJSON文字列の解析

```sql
SELECT json_parse('{"k1":"v31","k2":300}');
```
```text
+--------------------------------------+
| json_parse('{"k1":"v31","k2":300}') |
+--------------------------------------+
| {"k1":"v31","k2":300}                |
+--------------------------------------+
```
```sql
SELECT json_parse_error_to_invalid('{"k1":"v31","k2":300}');
```
```text
+-------------------------------------------------------+
| jsonb_parse_error_to_invalid('{"k1":"v31","k2":300}') |
+-------------------------------------------------------+
| {"k1":"v31","k2":300}                                 |
+-------------------------------------------------------+
```
```sql
SELECT json_parse_notnull('{"a":"b"}');
```
```text
+----------------------------------+
| jsonb_parse_notnull('{"a":"b"}') |
+----------------------------------+
| {"a":"b"}                        |
+----------------------------------+
```
```sql
SELECT json_parse_error_to_value('{"k1":"v31","k2":300}','{}');
```
```text
+-----------------------------------------------------------+
| jsonb_parse_error_to_value('{"k1":"v31","k2":300}', '{}') |
+-----------------------------------------------------------+
| {"k1":"v31","k2":300}                                     |
+-----------------------------------------------------------+
```
2. 無効なJSON文字列を解析する

```sql
SELECT json_parse('invalid json');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = json parse error: Invalid document: document must be an object or an array for value: invalid json
```
```sql
SELECT json_parse_error_to_invalid('invalid json');
```
```text
+----------------------------------------------+
| jsonb_parse_error_to_invalid('invalid json') |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```
```sql
SELECT json_parse_notnull('invalid json');
```
```text
+-------------------------------------------+
| jsonb_parse_error_to_null('invalid json') |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```
```sql
SELECT json_parse_error_to_value('invalid json', '{}');
```
```text
+--------------------------------------------------+
| json_parse_error_to_value('invalid json', '{}') |
+--------------------------------------------------+
| {}                                               |
+--------------------------------------------------+
```
