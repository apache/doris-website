---
{
    "title": "JSON_EXTRACT_DOUBLE",
    "language": "ja",
    "description": "JSONEXTRACTDOUBLE は、JSON オブジェクトから <jsonpath> で指定したフィールドを抽出し、DOUBLE 型に変換します。"
}
---

## 説明
`JSON_EXTRACT_DOUBLE` は、JSON オブジェクトから `<json_path>` で指定したフィールドを抽出し、[`DOUBLE`](../../../basic-element/sql-data-types/numeric/FLOATING-POINT.md) 型に変換します。

## 構文
```sql
JSON_EXTRACT_DOUBLE(<json_object>, <json_path>)
```

## パラメータ
- `<json_object>`: JSON 型。抽出元の JSON オブジェクトです。
- `<json_path>`: 文字列型。対象の JSON から要素を抽出するための JSON パスです。

## 戻り値
`Nullable(DOUBLE)`。抽出した DOUBLE 値を返します。場合によっては NULL を返します。

## 使用上の注意
1. `<json_object>` または `<json_path>` が NULL の場合、NULL を返します。
2. `<json_path>` で指定した要素が存在しない場合、NULL を返します。
3. `<json_path>` で指定した要素を DOUBLE に変換できない場合、NULL を返します。
4. 動作は「cast + json_extract」と同じで、次の式と等価です。
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
3. NULL パラメータ
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
4. DOUBLE に変換できない場合
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
