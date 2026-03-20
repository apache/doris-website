---
{
  "title": "JSON_EXTRACT_STRING",
  "description": "JSONEXTRACTSTRING は JSON オブジェクトから <jsonpath> で指定されたフィールドを抽出し、STRING 型に変換します。",
  "language": "ja"
}
---
## デスクリプション
`JSON_EXTRACT_STRING`はJSONオブジェクトから`<json_path>`で指定されたフィールドを抽出し、[`STRING`](../../../basic-element/sql-data-types/string-type/STRING.md)型に変換します。

## Syntax

```sql
JSON_EXTRACT_STRING(<json_object>, <json_path>)
```
## パラメータ
- `<json_object>`: JSON型、抽出元となる対象パラメータ。
- `<json_path>`: String型、対象JSONから目的の要素を抽出するためのJSONパス。

## Return Value
`Nullable(STRING)` 抽出されたSTRING値を返し、場合によってはNULLを返します

## Usage 注釈
1. `<json_object>`または`<json_path>`がNULLの場合、NULLを返します。
2. `<json_path>`で指定された要素が存在しない場合、NULLを返します。
3. `<json_path>`で指定された要素がSTRINGに変換できない場合、NULLを返します。
4. その動作は"cast + json_extract"と一致しており、以下と等価です：

    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as STRING)
    ```
そのため、`<json_path>`で指定されたオブジェクトがSTRING型でない場合でも、STRING型への変換をサポートしている限り、変換された値を取得できます。
5. ここで返されるSTRINGには二重引用符（"）は含まれません。
6. JSONオブジェクト内のnull値の場合、結果はNULLではなく文字列"null"になります。
要素がnullかどうかを確認したい場合は、[`JSON_EXTRACT_ISNULL`](./json-extract-isnull.md)関数を使用してください。

## 例
1. 通常のパラメータ

    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}', '$.name');
    ```
    ```text
    +---------------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}', '$.name') |
    +---------------------------------------------------------------+
    | doris                                                         |
    +---------------------------------------------------------------+
    ```
2. パスが存在しない場合

    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}', '$.name2');
    ```
    ```text
    +----------------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}', '$.name2') |
    +----------------------------------------------------------------+
    | NULL                                                           |
    +----------------------------------------------------------------+
    ```
3. NULLパラメータ

    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}', NULl);
    ```
    ```text
    +-----------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}', NULl) |
    +-----------------------------------------------------------+
    | NULL                                                      |
    +-----------------------------------------------------------+
    ```
    ```sql
    SELECT json_extract_string(NULL, '$.id2');
    ```
    ```text
    +------------------------------------+
    | json_extract_string(NULL, '$.id2') |
    +------------------------------------+
    | NULL                               |
    +------------------------------------+
    ```
4. 他の型がSTRINGに変換される場合

    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}','$.id');
    ```
    ```text
    +------------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}','$.id') |
    +------------------------------------------------------------+
    | 123                                                        |
    +------------------------------------------------------------+
    ```
5. Null値は、NULLの代わりに文字列"null"に変換されます

    ```sql
    SELECT json_extract_string('{"id": null, "name": "doris"}','$.id');
    ```
    ```text
    +-------------------------------------------------------------+
    | json_extract_string('{"id": null, "name": "doris"}','$.id') |
    +-------------------------------------------------------------+
    | null                                                        |
    +-------------------------------------------------------------+
    ```
