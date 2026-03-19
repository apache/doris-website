---
{
  "title": "JSON_PARSE",
  "description": "raw JSON文字列をJSONバイナリ形式に解析します。異なる例外データ処理要件を満たすため、",
  "language": "ja"
}
---
## 説明
生のJSON文字列をJSONバイナリ形式に解析します。異なる例外データ処理要件を満たすために、以下のようにさまざまなJSON_PARSEシリーズ関数が提供されています：
* `JSON_PARSE` JSON文字列を解析します。入力文字列が有効なJSON文字列でない場合、エラーが報告されます。
* `JSON_PARSE_ERROR_TO_NULL` JSON文字列を解析します。入力文字列が有効なJSON文字列でない場合、NULLを返します。
* `JSON_PARSE_ERROR_TO_VALUE` JSON文字列を解析します。入力文字列が有効なJSON文字列でない場合、パラメータdefault_json_valueで指定されたデフォルト値を返します。

## 構文

```sql
JSON_PARSE (<json_str>)
```
```sql
JSON_PARSE_ERROR_TO_NULL (<json_str>)
```
```sql
JSON_PARSE_ERROR_TO_VALUE (<json_str>, <default_json_value>)
```
## パラメータ
### 必須パラメータ
- `<json_str>` String型、その内容は有効なJSON文字列である必要があります。
### オプションパラメータ
- `<default_json_value>` JSON型、NULLも可能です。`<json_str>`の解析が失敗した場合、`<default_json_value>`がデフォルト値として返されます。

## 戻り値
`Nullable<JSON>` 解析されたJSONオブジェクトを返します。

## 使用上の注意
1. `<json_str>`がNULLの場合、結果もNULLになります。
2. `JSONB_PARSE`/`JSONB_PARSE_ERROR_TO_NULL`/`JSONB_PARSE_ERROR_TO_VALUE`は基本的に同じ動作をしますが、解析が失敗した際に得られる結果が異なります。

## 例
1. 通常のJSON文字列の解析

    ```sql
    SELECT json_parse('{"k1":"v31","k2":300}');
    ```
    ```text
    +-------------------------------------+
    | json_parse('{"k1":"v31","k2":300}') |
    +-------------------------------------+
    | {"k1":"v31","k2":300}               |
    +-------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_null('{"k1":"v31","k2":300}','{}');
    ```
    ```text
    +---------------------------------------------------+
    | json_parse_error_to_null('{"k1":"v31","k2":300}') |
    +---------------------------------------------------+
    | {"k1":"v31","k2":300}                             |
    +---------------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('{"k1":"v31","k2":300}','{}');
    ```
    ```text
    +---------------------------------------------------------+
    | json_parse_error_to_value('{"k1":"v31","k2":300}','{}') |
    +---------------------------------------------------------+
    | {"k1":"v31","k2":300}                                   |
    +---------------------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('{"k1":"v31","k2":300}', NULL);
    ```
    ```text
    +----------------------------------------------------------+
    | json_parse_error_to_value('{"k1":"v31","k2":300}', NULL) |
    +----------------------------------------------------------+
    | {"k1":"v31","k2":300}                                    |
    +----------------------------------------------------------+
    ```
2. 無効なJSON文字列の解析

    ```sql
    SELECT json_parse('invalid json');
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]Parse json document failed at row 0, error: [INTERNAL_ERROR]simdjson parse exception:
    ```
    ```sql
    SELECT json_parse_error_to_null('invalid json');
    ```
    ```text
    +------------------------------------------+
    | json_parse_error_to_null('invalid json') |
    +------------------------------------------+
    | NULL                                     |
    +------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('invalid json');
    ```
    ```text
    +-------------------------------------------+
    | json_parse_error_to_value('invalid json') |
    +-------------------------------------------+
    | {}                                        |
    +-------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('invalid json', '{"key": "default value"}');
    ```
    ```text
    +-----------------------------------------------------------------------+
    | json_parse_error_to_value('invalid json', '{"key": "default value"}') |
    +-----------------------------------------------------------------------+
    | {"key":"default value"}                                               |
    +-----------------------------------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('invalid json', NULL);
    ```
    ```text
    +-------------------------------------------------+
    | json_parse_error_to_value('invalid json', NULL) |
    +-------------------------------------------------+
    | NULL                                            |
    +-------------------------------------------------+
    ```
3. NULL パラメータ

    ```sql
    SELECT json_parse(NULL);
    ```
    ```text
    +------------------+
    | json_parse(NULL) |
    +------------------+
    | NULL             |
    +------------------+
    ```
    ```sql
    SELECT json_parse_error_to_null(NULL);
    ```
    ```text
    +--------------------------------+
    | json_parse_error_to_null(NULL) |
    +--------------------------------+
    | NULL                           |
    +--------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value(NULL, '{}');
    ```
    ```text
    +---------------------------------------+
    | json_parse_error_to_value(NULL, '{}') |
    +---------------------------------------+
    | NULL                                  |
    +---------------------------------------+
    ```
