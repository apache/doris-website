---
{
  "title": "JSON_EXTRACT_INT",
  "description": "JSONEXTRACTINT は JSON オブジェクトから <jsonpath> で指定されたフィールドを抽出し、INT 型に変換します。",
  "language": "ja"
}
---
## 概要
`JSON_EXTRACT_INT`は、JSONオブジェクトから`<json_path>`で指定されたフィールドを抽出し、[`INT`](../../../basic-element/sql-data-types/numeric/INT.md)型に変換します。

## 構文

```sql
JSON_EXTRACT_INT(<json_object>, <json_path>)
```
## パラメータ
- `<json_object>`: JSON型、抽出対象のパラメータ。
- `<json_path>`: String型、対象JSONから目的の要素を抽出するためのJSONパス。

## 戻り値
`Nullable(INT)` 抽出されたINT値を返す。場合によってはNULLを返す

## 使用上の注意
1. `<json_object>`または`<json_path>`がNULLの場合、NULLを返す。
2. `<json_path>`で指定された要素が存在しない場合、NULLを返す。
3. `<json_path>`で指定された要素がINTに変換できない場合、NULLを返す。
4. この動作は"cast + json_extract"と一致しており、以下と等価である：

    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as INT)
    ```
## 例
1. 通常のパラメータ

    ```sql
    SELECT json_extract_int('{"id": 123, "name": "doris"}', '$.id');
    ```
    ```text
    +----------------------------------------------------------+
    | json_extract_int('{"id": 123, "name": "doris"}', '$.id') |
    +----------------------------------------------------------+
    |                                                      123 |
    +----------------------------------------------------------+
    ```
2. パスが存在しない場合

    ```sql
    SELECT json_extract_int('{"id": 123, "name": "doris"}', '$.id2');
    ```
    ```text
    +-----------------------------------------------------------+
    | json_extract_int('{"id": 123, "name": "doris"}', '$.id2') |
    +-----------------------------------------------------------+
    |                                                      NULL |
    +-----------------------------------------------------------+
    ```
3. NULL パラメータ

    ```sql
    SELECT json_extract_int('{"id": 123, "name": "doris"}', NULl);
    ```
    ```text
    +--------------------------------------------------------+
    | json_extract_int('{"id": 123, "name": "doris"}', NULl) |
    +--------------------------------------------------------+
    |                                                   NULL |
    +--------------------------------------------------------+
    ```
    ```sql
    SELECT json_extract_int(NULL, '$.id2');
    ```
    ```text
    +---------------------------------+
    | json_extract_int(NULL, '$.id2') |
    +---------------------------------+
    |                            NULL |
    +---------------------------------+
    ```
4. INTへの変換ができない場合

    ```sql
    SELECT json_extract_int('{"id": 123, "name": "doris"}','$.name');
    ```
    ```text
    +-----------------------------------------------------------+
    | json_extract_int('{"id": 123, "name": "doris"}','$.name') |
    +-----------------------------------------------------------+
    |                                                      NULL |
    +-----------------------------------------------------------+
    ```
