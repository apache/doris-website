---
{
    "title": "JSON_EXTRACT_STRING",
    "language": "ko",
    "description": "JSONEXTRACTSTRING은 JSON 객체에서 <jsonpath>로 지정한 필드를 추출하여 STRING 타입으로 변환합니다."
}
---

## 설명 {#description}
`JSON_EXTRACT_STRING`은 JSON 객체에서 `<json_path>`로 지정한 필드를 추출하여 [`STRING`](../../../basic-element/sql-data-types/string-type/STRING.md) 타입으로 변환합니다.

## 구문 {#syntax}
```sql
JSON_EXTRACT_STRING(<json_object>, <json_path>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<json_object>` | 필수입니다. JSON 값 또는 JSON으로 변환할 수 있는 유효한 JSON 텍스트입니다. |
| `<json_path>` | 필수입니다. STRING 타입의 JSON 경로입니다. 배열을 순회하려면 와일드카드를 명시적으로 사용해야 합니다. |

## 반환 값 {#return-value}
`Nullable(STRING)` 추출한 STRING 값을 반환하며, 일부 경우에는 NULL을 반환합니다.

## 사용 시 참고 사항 {#usage-notes}
1. `<json_object>` 또는 `<json_path>`가 NULL이면 NULL을 반환합니다.
2. `<json_path>`로 지정한 요소가 없으면 NULL을 반환합니다.
3. `<json_path>`로 지정한 요소를 STRING으로 변환할 수 없으면 NULL을 반환합니다.
4. 동작은 "cast + json_extract"와 같으며, 다음과 동등합니다:
    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as STRING)
    ```
    따라서 `<json_path>`가 가리키는 객체가 STRING 타입이 아니더라도 STRING 타입으로 변환할 수 있으면 변환된 값을 얻을 수 있습니다.
5. 여기서 반환하는 STRING에는 큰따옴표(")가 포함되지 않습니다.
6. JSON 객체의 null 값에 대해서는 NULL이 아닌 문자열 "null"을 반환합니다. 
요소가 null인지 확인하려면 [`JSON_EXTRACT_ISNULL`](./json-extract-isnull.md) 함수를 사용하세요.

## 예제 {#examples}
1. 일반적인 매개변수
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
```
