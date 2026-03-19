---
{
  "title": "JSON_EXTRACT_BOOL",
  "language": "ja",
  "description": "JSONEXTRACTBOOLは、JSONオブジェクトから<jsonpath>で指定されたフィールドを抽出し、BOOLEAN型に変換します。"
}
---
## 説明
`JSON_EXTRACT_BOOL`は、JSONオブジェクトから`<json_path>`で指定されたフィールドを抽出し、[`BOOLEAN`](../../../basic-element/sql-data-types/numeric/BOOLEAN.md)型に変換します。

## 構文

```sql
JSON_EXTRACT_BOOL(<json_object>, <json_path>)
```
## パラメータ
- `<json_object>`: JSON型、抽出対象のパラメータ。
- `<json_path>`: String型、対象JSONから対象要素を抽出するJSONパス。

## 戻り値
`Nullable(BOOLEAN)` 抽出されたBOOLEAN値を返します。場合によってはNULLを返します

## 使用上の注意
1. `<json_object>`または`<json_path>`がNULLの場合、NULLを返します。
2. `<json_path>`で指定された要素が存在しない場合、NULLを返します。
3. `<json_path>`で指定された要素がBOOLEANに変換できない場合、NULLを返します。
4. その動作は「cast + json_extract」と一致しており、以下と等価です：

    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as BOOLEAN)
    ```
## 例
1. 通常のパラメータ

    ```sql
    SELECT json_extract_bool('{"id": true, "name": "doris"}', '$.id');
    ```
    ```text
    +------------------------------------------------------------+
    | json_extract_bool('{"id": true, "name": "doris"}', '$.id') |
    +------------------------------------------------------------+
    |                                                          1 |
    +------------------------------------------------------------+
    ```
2. パスが存在しない場合

    ```sql
    SELECT json_extract_bool('{"id": true, "name": "doris"}', '$.id2');
    ```
    ```text
    +-------------------------------------------------------------+
    | json_extract_bool('{"id": true, "name": "doris"}', '$.id2') |
    +-------------------------------------------------------------+
    |                                                        NULL |
    +-------------------------------------------------------------+
    ```
3. NULL パラメータ

    ```sql
    SELECT json_extract_bool('{"id": true, "name": "doris"}', NULl);
    ```
    ```text
    +----------------------------------------------------------+
    | json_extract_bool('{"id": true, "name": "doris"}', NULl) |
    +----------------------------------------------------------+
    |                                                     NULL |
    +----------------------------------------------------------+
    ```
    ```sql
    SELECT json_extract_bool(NULL, '$.id2');
    ```
    ```text
    +----------------------------------+
    | json_extract_bool(NULL, '$.id2') |
    +----------------------------------+
    |                             NULL |
    +----------------------------------+
    ```
4. BOOLEANへの変換ができない場合

    ```sql
    SELECT json_extract_bool('{"id": 123, "name": "doris"}','$.name');
    ```
    ```text
    +------------------------------------------------------------+
    | json_extract_bool('{"id": 123, "name": "doris"}','$.name') |
    +------------------------------------------------------------+
    |                                                       NULL |
    +------------------------------------------------------------+
    ```
