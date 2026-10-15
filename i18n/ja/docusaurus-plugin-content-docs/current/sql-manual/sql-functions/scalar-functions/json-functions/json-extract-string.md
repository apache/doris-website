---
{
    "title": "JSON_EXTRACT_STRING",
    "language": "ja",
    "description": "JSONEXTRACTSTRING は JSON オブジェクトから <jsonpath> で指定したフィールドを抽出し、STRING 型に変換します。"
}
---

## 説明
`JSON_EXTRACT_STRING` は JSON オブジェクトから `<json_path>` で指定したフィールドを抽出し、[`STRING`](../../../basic-element/sql-data-types/string-type/STRING.md) 型に変換します。

## 構文
```sql
JSON_EXTRACT_STRING(<json_object>, <json_path>)
```

## パラメータ
- `<json_object>`: 抽出元となる JSON 型のパラメータです。
- `<json_path>`: 対象の JSON から要素を抽出するための文字列型の JSON パスです。

## 戻り値
`Nullable(STRING)` 型の抽出した文字列値を返します。場合によっては NULL を返します。

## 使用上の注意
1. `<json_object>` または `<json_path>` が NULL の場合は NULL を返します。
2. `<json_path>` で指定した要素が存在しない場合は NULL を返します。
3. `<json_path>` で指定した要素を STRING 型に変換できない場合は NULL を返します。
4. 動作は「cast + json_extract」と同じで、次の式に相当します。
    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as STRING)
    ```
    したがって、`<json_path>` が指す値が STRING 型でなくても、STRING 型への変換に対応していれば変換後の値を取得できます。
5. ここで返される文字列には二重引用符（"）は含まれません。
6. JSON オブジェクト内の null 値に対しては、NULL ではなく文字列の "null" を返します。
要素が null かどうかを確認するには、[`JSON_EXTRACT_ISNULL`](./json-extract-isnull.md) 関数を使用してください。

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
3. NULL パラメータ
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
4. 他の型を STRING 型に変換する場合
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
5. null 値は NULL ではなく文字列の "null" に変換される
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
