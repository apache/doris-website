---
{
  "title": "JSON_EXTRACT_DOUBLE",
  "language": "ja",
  "description": "JSONEXTRACTDOUBLEは、JSONオブジェクトから<jsonpath>で指定されたフィールドを抽出し、DOUBLE型に変換します。"
}
---
## 説明
`JSON_EXTRACT_DOUBLE`は、JSONオブジェクトから`<json_path>`で指定されたフィールドを抽出し、[`DOUBLE`](../../../basic-element/sql-data-types/numeric/FLOATING-POINT.md)型に変換します。

## 構文

```sql
JSON_EXTRACT_DOUBLE(<json_object>, <json_path>)
```
## パラメータ
- `<json_object>`: JSON型、抽出元となる対象パラメータ。
- `<json_path>`: String型、対象JSONから対象要素を抽出するためのJSONパス。

## 戻り値
`Nullable(DOUBLE)` 抽出されたDOUBLE値を返す。場合によってはNULLを返す

## 使用上の注意
1. `<json_object>`または`<json_path>`がNULLの場合、NULLを返す。
2. `<json_path>`で指定された要素が存在しない場合、NULLを返す。
3. `<json_path>`で指定された要素がDOUBLEに変換できない場合、NULLを返す。
4. この動作は「cast + json_extract」と一致しており、以下と同等である：

    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as DOUBLE)
    ```
## 例
1. 通常のパラメータ

    ```sql
    SELECT json_extract_double('{"id": 123.345, "name": "doris"}', '$.id');
    ```
    ```text
    +-----------------------------------------------------------------+
    | json_extract_double('{"id": 123.345, "name": "doris"}', '$.id') |
    +-----------------------------------------------------------------+
    |                                                         123.345 |
    +-----------------------------------------------------------------+
    ```
2. パスが存在しない場合

    ```sql
    SELECT json_extract_double('{"id": 123.345, "name": "doris"}', '$.id2');
    ```
    ```text
    +------------------------------------------------------------------+
    | json_extract_double('{"id": 123.345, "name": "doris"}', '$.id2') |
    +------------------------------------------------------------------+
    |                                                             NULL |
    +------------------------------------------------------------------+
    ```
3. NULLパラメータ

    ```sql
    SELECT json_extract_double('{"id": 123.345, "name": "doris"}', NULl);
    ```
    ```text
    +---------------------------------------------------------------+
    | json_extract_double('{"id": 123.345, "name": "doris"}', NULl) |
    +---------------------------------------------------------------+
    |                                                          NULL |
    +---------------------------------------------------------------+
    ```
    ```sql
    SELECT json_extract_double(NULL, '$.id2');
    ```
    ```text
    +------------------------------------+
    | json_extract_double(NULL, '$.id2') |
    +------------------------------------+
    |                               NULL |
    +------------------------------------+
    ```
4. DOUBLEへの変換ができない場合

    ```sql
    SELECT json_extract_double('{"id": 123, "name": "doris"}','$.name');
    ```
    ```text
    +--------------------------------------------------------------+
    | json_extract_double('{"id": 123, "name": "doris"}','$.name') |
    +--------------------------------------------------------------+
    |                                                         NULL |
    +--------------------------------------------------------------+
    ```
