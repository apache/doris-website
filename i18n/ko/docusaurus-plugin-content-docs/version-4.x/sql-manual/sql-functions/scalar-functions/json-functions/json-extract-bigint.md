---
{
    "title": "JSON_EXTRACT_BIGINT",
    "language": "ko",
    "description": "JSONEXTRACTBIGINT는 JSON 객체에서 <jsonpath>로 지정된 필드를 추출하여 BIGINT 타입으로 변환합니다."
}
---

## 설명 {#description}
`JSON_EXTRACT_BIGINT`는 JSON 객체에서 `<json_path>`로 지정된 필드를 추출하여 [`BIGINT`](../../../basic-element/sql-data-types/numeric/BIGINT.md) 타입으로 변환합니다.

## 구문 {#syntax}
```sql
JSON_EXTRACT_BIGINT(<json_object>, <json_path>)
```

## 매개변수 {#parameters}
- `<json_object>`: JSON 타입으로, 값을 추출할 대상 매개변수입니다.
- `<json_path>`: String 타입으로, 대상 JSON에서 추출할 요소를 지정하는 JSON 경로입니다.

## 반환값 {#return-value}
`Nullable(BIGINT)`: 추출한 BIGINT 값을 반환하며, 일부 경우에는 NULL을 반환합니다.

## 사용 시 참고 사항 {#usage-notes}
1. `<json_object>` 또는 `<json_path>`가 NULL이면 NULL을 반환합니다.
2. `<json_path>`로 지정된 요소가 없으면 NULL을 반환합니다.
3. `<json_path>`로 지정된 요소를 BIGINT로 변환할 수 없으면 NULL을 반환합니다.
4. 동작은 "cast + json_extract"와 동일하며, 다음과 동등합니다:
    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as BIGINT)
    ```

## 예제 {#examples}
1. 정상적인 매개변수
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
2. 경로가 없는 경우
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
3. NULL 매개변수
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
4. BIGINT로 변환할 수 없는 경우
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
