---
{
    "title": "JSON_EXTRACT_STRING",
    "language": "ja",
    "description": "JSON オブジェクトから JSON パスが指す値を抽出し、STRING 型に変換します。"
}
---

## 説明
`JSON_EXTRACT_STRING` は、JSON オブジェクトから `<json_path>` が指す値を抽出し、[`STRING`](../../../basic-element/sql-data-types/string-type/STRING.md) 型に変換します。

## 構文
```sql
JSON_EXTRACT_STRING(<json_object>, <json_path>)
```

## パラメータ
| パラメータ | 説明 |
| --- | --- |
| `<json_object>` | 抽出元の JSON 型の値。 |
| `<json_path>` | 抽出する要素を指定する文字列型の JSON パス。 |

## 戻り値
`Nullable(STRING)` を返します。JSON パスが指す値を STRING 型に変換した結果です。入力が NULL の場合、パスが存在しない場合、または値を STRING 型に変換できない場合は NULL を返します。

## 使用上の注意
1. `<json_object>` または `<json_path>` が NULL の場合は NULL を返します。
2. `<json_path>` が指す要素が存在しない場合は NULL を返します。
3. `<json_path>` が指す値を STRING 型に変換できない場合は NULL を返します。
4. 動作は「CAST と JSON_EXTRACT の組み合わせ」と同じで、次の式と等価です。
    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as STRING)
    ```
    `<json_path>` が指す値が STRING 型でなくても、STRING 型に変換できれば変換後の値を取得できます。
5. 返される STRING には二重引用符（"）を含みません。
6. JSON オブジェクト内の null 値は SQL の NULL ではなく、文字列 "null" に変換されます。要素が null かどうかを判定するには、[`JSON_EXTRACT_ISNULL`](./json-extract-isnull.md) を使用してください。

## 例
1. 通常の使用例
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
3. NULL を渡した場合
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
4. 他の型を STRING に変換する場合
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
5. JSON の null 値を文字列 "null" に変換する場合
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
