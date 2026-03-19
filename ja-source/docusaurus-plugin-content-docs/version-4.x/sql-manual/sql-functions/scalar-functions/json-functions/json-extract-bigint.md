---
{
  "title": "JSON_EXTRACT_BIGINT",
  "description": "JSONEXTRACTBIGINT は JSON オブジェクトから <jsonpath> で指定されたフィールドを抽出し、BIGINT 型に変換します。",
  "language": "ja"
}
---
## 説明
`JSON_EXTRACT_BIGINT`は、JSONオブジェクトから`<json_path>`で指定されたフィールドを抽出し、[`BIGINT`](../../../basic-element/sql-data-types/numeric/BIGINT.md)型に変換します。

## 構文

```sql
JSON_EXTRACT_BIGINT(<json_object>, <json_path>)
```
## パラメータ
- `<json_object>`: JSON型、抽出対象のパラメータ
- `<json_path>`: String型、対象JSONから目的の要素を抽出するためのJSONパス

## Return Value
`Nullable(BIGINT)` 抽出されたBIGINT値を返します。場合によってはNULLを返します

## Usage 注釈
1. `<json_object>`または`<json_path>`がNULLの場合、NULLを返します。
2. `<json_path>`で指定された要素が存在しない場合、NULLを返します。
3. `<json_path>`で指定された要素がBIGINTに変換できない場合、NULLを返します。
4. その動作は「cast + json_extract」と一致しており、以下と同等です：

    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as BIGINT)
    ```
## Examples
1. 通常のパラメータ

    ```sql
    SELECT json_extract_bigint('{"id": 122222222222223, "name": "doris"}', '$.id');
    ```
    ```text
    +-------------------------------------------------------------------------+
    | json_extract_bigint('{"id": 122222222222223, "name": "doris"}', '$.id') |
    +-------------------------------------------------------------------------+
    |                                                         122222222222223 |
    +-------------------------------------------------------------------------+
    ```
2. パスが存在しない場合

    ```sql
    SELECT json_extract_bigint('{"id": 122222222222223, "name": "doris"}', '$.id2');
    ```
    ```text
    +--------------------------------------------------------------------------+
    | json_extract_bigint('{"id": 122222222222223, "name": "doris"}', '$.id2') |
    +--------------------------------------------------------------------------+
    |                                                                     NULL |
    +--------------------------------------------------------------------------+
    ```
3. NULLパラメータ

    ```sql
    SELECT json_extract_bigint('{"id": 122222222222223, "name": "doris"}', NULl);
    ```
    ```text
    +-----------------------------------------------------------------------+
    | json_extract_bigint('{"id": 122222222222223, "name": "doris"}', NULl) |
    +-----------------------------------------------------------------------+
    |                                                                  NULL |
    +-----------------------------------------------------------------------+
    ```
    ```sql
    SELECT json_extract_bigint(NULL, '$.id2');
    ```
    ```text
    +------------------------------------+
    | json_extract_bigint(NULL, '$.id2') |
    +------------------------------------+
    |                               NULL |
    +------------------------------------+
    ```
4. BIGINTへの変換ができない場合

    ```sql
    SELECT json_extract_bigint('{"id": 123, "name": "doris"}','$.name');
    ```
    ```text
    +--------------------------------------------------------------+
    | json_extract_bigint('{"id": 123, "name": "doris"}','$.name') |
    +--------------------------------------------------------------+
    |                                                         NULL |
    +--------------------------------------------------------------+
    ```
