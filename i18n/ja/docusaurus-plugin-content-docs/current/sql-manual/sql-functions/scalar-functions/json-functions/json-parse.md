---
{
    "title": "JSON_PARSE",
    "language": "ja",
    "description": "生の JSON 文字列をバイナリ JSON 形式に解析します。解析エラー時の扱いに応じて複数の関数を使用できます。"
}
---

## 説明
生の JSON 文字列をバイナリ JSON 形式に解析します。解析エラー時のデータ処理要件に応じて、次の JSON_PARSE 系関数が用意されています。
* `JSON_PARSE` は JSON 文字列を解析します。入力文字列が有効な JSON 文字列でない場合はエラーが発生します。
* `JSON_PARSE_ERROR_TO_NULL` は JSON 文字列を解析します。入力文字列が有効な JSON 文字列でない場合は NULL を返します。
* `JSON_PARSE_ERROR_TO_VALUE` は JSON 文字列を解析します。入力文字列が有効な JSON 文字列でない場合は、パラメータ default_json_value で指定したデフォルト値を返します。

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
- `<json_str>` 文字列型です。内容は有効な JSON 文字列である必要があります。
### 任意パラメータ
- `<default_json_value>` JSON 型です。NULL も指定できます。`<json_str>` の解析に失敗した場合、`<default_json_value>` をデフォルト値として返します。

## 戻り値
`Nullable<JSON>` 解析した JSON オブジェクトを返します。

## 使用上の注意
1. `<json_str>` が NULL の場合、結果も NULL になります。
2. `JSON_PARSE`、`JSON_PARSE_ERROR_TO_NULL`、`JSON_PARSE_ERROR_TO_VALUE` は、解析に失敗した場合の結果を除き、基本的に同じ動作をします。

## 例
1. 通常の JSON 文字列の解析
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
