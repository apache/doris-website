---
{
    "title": "JSON_PARSE",
    "language": "ja",
    "description": "JSON 文字列をバイナリ形式の JSON に解析します。解析失敗時の動作に応じて関数を選べます。"
}
---

## 説明
JSON 文字列をバイナリ形式の JSON に解析します。解析失敗時に必要な動作に応じて、次の JSON_PARSE 系関数を使用できます。
* `JSON_PARSE` は JSON 文字列を解析します。無効な JSON 文字列の場合はエラーになります。
* `JSON_PARSE_ERROR_TO_NULL` は JSON 文字列を解析します。無効な JSON 文字列の場合は NULL を返します。
* `JSON_PARSE_ERROR_TO_VALUE` は JSON 文字列を解析します。無効な JSON 文字列の場合は default_json_value で指定した既定値を返します。

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

| パラメータ | 説明 |
| --- | --- |
| `<json_str>` | 有効な JSON 文字列を内容に持つ文字列型の値。必須。 |
### 任意パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<default_json_value>` | `<json_str>` の解析に失敗した場合に `<default_json_value>` を返します。JSON 型の値で、NULL も指定できます。任意。 |

## 戻り値
`Nullable<JSON>` 型で、解析後の JSON 値を返します。入力文字列が NULL の場合は NULL を返します。解析に失敗した場合の戻り値は関数ごとに異なります。

## 使用上の注意
1. `<json_str>` が NULL の場合、結果も NULL です。
2. `JSON_PARSE`、`JSON_PARSE_ERROR_TO_NULL`、`JSON_PARSE_ERROR_TO_VALUE` は、解析に失敗した場合の結果を除き、基本的に同じ動作をします。

## 例
1. 正常な JSON 文字列の解析
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
    SELECT json_parse_error_to_null('{"k1":"v31","k2":300}');
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
2. 無効な JSON 文字列の解析
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
