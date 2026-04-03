---
{
  "title": "JSON_EXTRACT_INT",
  "language": "ja",
  "description": "JSONEXTRACTINTは、JSONオブジェクトから<jsonpath>で指定されたフィールドを抽出し、INT型に変換します。"
}
---
## 説明
`JSON_EXTRACT_INT`は、JSONオブジェクトから`<json_path>`で指定されたフィールドを抽出し、[`INT`](../../../basic-element/sql-data-types/numeric/INT.md)型に変換します。

## 構文

```sql
JSON_EXTRACT_INT(<json_object>, <json_path>)
```
## パラメータ
- `<json_object>`: JSON型、抽出対象のパラメータ。
- `<json_path>`: String型、対象JSONから目的の要素を抽出するためのJSONパス。

## 戻り値
`Nullable(INT)` 抽出されたINT値を返し、場合によってはNULLを返します

## 使用上の注意
1. `<json_object>` または `<json_path>` がNULLの場合、NULLを返します。
2. `<json_path>` で指定された要素が存在しない場合、NULLを返します。
3. `<json_path>` で指定された要素がINTに変換できない場合、NULLを返します。
4. その動作は「cast + json_extract」と一致しており、これは以下と同等です：

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
3. NULLパラメータ

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
4. INTへの変換が不可能な場合

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
