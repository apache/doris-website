---
{
  "title": "JSON_EXTRACT_ISNULL",
  "language": "ja",
  "description": "JSONEXTRACTISNULLは、JSONオブジェクト内の<jsonpath>で指定されたフィールドがnull値かどうかを判定します。"
}
---
## 説明
`JSON_EXTRACT_ISNULL`は、JSONオブジェクト内の`<json_path>`で指定されたフィールドがnull値かどうかを判定します。

## 構文

```sql
JSON_EXTRACT_ISNULL(<json_object>, <json_path>)
```
## パラメータ
- `<json_object>`: JSON型、抽出対象のパラメータ。
- `<json_path>`: String型、対象JSONから目的の要素を抽出するためのJSONパス。

## 戻り値
`Nullable(BOOL)` 値がnullの場合はtrueを返し、そうでなければfalseを返します。

## 使用上の注意
1. `<json_object>`または`<json_path>`がNULLの場合、NULLを返します。
2. `<json_path>`で指定された要素が存在しない場合、NULLを返します。
3. `<json_path>`で指定された要素がnullでない場合、falseを返します。

## 例
1. 通常のパラメータ

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
3. NULLパラメータ

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
