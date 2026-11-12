---
{
    "title": "JSON_EXTRACT_STRING",
    "language": "ja",
    "description": "JSONEXTRACTSTRING は JSON オブジェクトから <jsonpath> で指定したフィールドを抽出し、STRING 型に変換します。"
}
---

## 説明 {#description}
`JSON_EXTRACT_STRING` は JSON オブジェクトから `<json_path>` で指定したフィールドを抽出し、[`STRING`](../../../basic-element/sql-data-types/string-type/STRING.md) 型に変換します。

## 構文 {#syntax}
```sql
JSON_EXTRACT_STRING(<json_object>, <json_path>)
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| --- | --- |
| `<json_object>` | 必須。JSON 値、または JSON に変換できる有効な JSON テキスト。 |
| `<json_path>` | 必須。STRING 型の JSON パス。配列を走査するには明示的なワイルドカードを使用します。 |

## 戻り値 {#return-value}
`Nullable(STRING)` 抽出した STRING 値を返します。場合によっては NULL を返します。

## 使用上の注意 {#usage-notes}
1. `<json_object>` または `<json_path>` が NULL の場合、NULL を返します。
2. `<json_path>` で指定した要素が存在しない場合、NULL を返します。
3. `<json_path>` で指定した要素を STRING に変換できない場合、NULL を返します。
4. 動作は "cast + json_extract" と同じで、次の式と等価です。
    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as STRING)
    ```
    そのため、`<json_path>` が指すオブジェクトが STRING 型でなくても、STRING 型に変換できれば、変換後の値を取得できます。
5. 返される STRING には二重引用符（"）は含まれません。
6. JSON オブジェクト内の null 値の場合、結果は NULL ではなく文字列 "null" になります。
要素が null かどうかを確認するには、[`JSON_EXTRACT_ISNULL`](./json-extract-isnull.md) 関数を使用してください。

## 例 {#examples}
1. 通常のパラメータ
    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}', '$.name');
    ```
    ```text
```

```text
+---------------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}', '$.name') |
    +---------------------------------------------------------------+
    | doris                                                         |
    +---------------------------------------------------------------+
    ```
2. Case where path does not exist
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
3. NULL parameters
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
4. Case where other types are converted to STRING
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
5. Null values will be converted to string "null" instead of NULL
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

### Extracting the same field from array elements (Doris 4.0 and later)

Use `$[*].k1` to traverse array elements explicitly. `$.k1` only accesses object members and does not implicitly traverse an array, so the direct path below returns SQL `NULL`. Array elements without `k1` are omitted from the matches.

The result is a `STRING` containing JSON array text, rather than a SQL `ARRAY`.
```sql
SELECT json_extract_string('[{"k1":"v1"},{"k2":"v2"},{"k1":"v3"},{"k1":"v4"}]', '$.k1') AS direct_path,
       json_extract_string('[{"k1":"v1"},{"k2":"v2"},{"k1":"v3"},{"k1":"v4"}]', '$[*].k1') AS all_values;
```

```text
+-------------+------------------+
| direct_path | all_values       |
+-------------+------------------+
| NULL        | ["v1","v3","v4"] |
+-------------+------------------+
