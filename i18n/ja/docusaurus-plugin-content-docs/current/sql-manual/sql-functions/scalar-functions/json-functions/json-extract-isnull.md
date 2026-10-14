---
{
    "title": "JSON_EXTRACT_ISNULL",
    "language": "ja",
    "description": "JSONEXTRACTISNULL は、JSON オブジェクト内で <jsonpath> が指定するフィールドの値が null かどうかを判定します。"
}
---

## 説明
`JSON_EXTRACT_ISNULL` は、JSON オブジェクト内で `<json_path>` が指す値が null かどうかを判定します。

## 構文
```sql
JSON_EXTRACT_ISNULL(<json_object>, <json_path>)
```

## パラメータ
- `<json_object>`: 抽出元となる JSON 型の値。
- `<json_path>`: 対象の JSON から要素を抽出するための、文字列型の JSON パス。

## 戻り値
`Nullable(BOOL)` を返します。指定した値が null の場合は true、null でない場合は false です。入力が NULL の場合やパスが存在しない場合は NULL を返します。

## 使用上の注意
1. `<json_object>` または `<json_path>` が NULL の場合は NULL を返します。
2. `<json_path>` が指す要素が存在しない場合は NULL を返します。
3. `<json_path>` が指す値が null でない場合は false を返します。

## 例
1. 通常の使用例
    ```sql
    SELECT json_extract_isnull('{"id": 123, "name": "doris"}', '$.id');
    ```
    ```text
    +-------------------------------------------------------------+
    | json_extract_isnull('{"id": 123, "name": "doris"}', '$.id') |
    +-------------------------------------------------------------+
    |                                                           0 |
    +-------------------------------------------------------------+
    ```

    ```sql
    SELECT json_extract_isnull('{"id": null, "name": "doris"}', '$.id');
    ```
    ```text
    +--------------------------------------------------------------+
    | json_extract_isnull('{"id": null, "name": "doris"}', '$.id') |
    +--------------------------------------------------------------+
    |                                                            1 |
    +--------------------------------------------------------------+
    ```
2. パスが存在しない場合
    ```sql
    SELECT json_extract_isnull('{"id": null, "name": "doris"}', '$.id2');
    ```
    ```text
    +---------------------------------------------------------------+
    | json_extract_isnull('{"id": null, "name": "doris"}', '$.id2') |
    +---------------------------------------------------------------+
    |                                                          NULL |
    +---------------------------------------------------------------+
    ```
3. NULL を渡した場合
    ```sql
    SELECT json_extract_isnull('{"id": 123, "name": "doris"}', NULl);
    ```
    ```text
    +-----------------------------------------------------------+
    | json_extract_isnull('{"id": 123, "name": "doris"}', NULl) |
    +-----------------------------------------------------------+
    |                                                      NULL |
    +-----------------------------------------------------------+
    ```
    ```sql
    SELECT json_extract_isnull(NULL, '$.id2');
    ```
    ```text
    +------------------------------------+
    | json_extract_isnull(NULL, '$.id2') |
    +------------------------------------+
    |                               NULL |
    +------------------------------------+
    ```
