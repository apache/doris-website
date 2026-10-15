---
{
    "title": "JSON_EXTRACT_INT",
    "language": "ja",
    "description": "JSONEXTRACTINT は JSON オブジェクトから <jsonpath> で指定したフィールドを抽出し、INT 型に変換します。"
}
---

## 説明
`JSON_EXTRACT_INT` は JSON オブジェクトから `<json_path>` で指定したフィールドを抽出し、[`INT`](../../../basic-element/sql-data-types/numeric/INT.md) 型に変換します。

## 構文
```sql
JSON_EXTRACT_INT(<json_object>, <json_path>)
```

## パラメータ
- `<json_object>`: 抽出元となる JSON 型のパラメータです。
- `<json_path>`: 対象の JSON から要素を抽出するための String 型の JSON パスです。

## 戻り値
`Nullable(INT)` 抽出した INT 値を返します。場合によっては NULL を返します。

## 使用上の注意
1. `<json_object>` または `<json_path>` が NULL の場合は NULL を返します。
2. `<json_path>` で指定した要素が存在しない場合は NULL を返します。
3. `<json_path>` で指定した要素を INT に変換できない場合は NULL を返します。
4. 動作は "cast + json_extract" と同じで、次の式に相当します。
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
4. INT に変換できない場合
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
