---
{
    "title": "JSON_EXTRACT_INT",
    "language": "ko",
    "description": "JSONEXTRACTINT는 JSON 객체에서 <jsonpath>로 지정된 필드를 추출하여 INT 타입으로 변환합니다."
}
---

## 설명 {#description}
`JSON_EXTRACT_INT`는 JSON 객체에서 `<json_path>`로 지정된 필드를 추출하여 [`INT`](../../../basic-element/sql-data-types/numeric/INT.md) 타입으로 변환합니다.

## 구문 {#syntax}
```sql
JSON_EXTRACT_INT(<json_object>, <json_path>)
```

## 매개변수 {#parameters}
- `<json_object>`: JSON 타입으로, 값을 추출할 대상 매개변수입니다.
- `<json_path>`: String 타입으로, 대상 JSON에서 추출할 요소를 지정하는 JSON 경로입니다.

## 반환 값 {#return-value}
`Nullable(INT)` 추출한 INT 값을 반환하며, 경우에 따라 NULL을 반환합니다.

## 사용 시 주의 사항 {#usage-notes}
1. `<json_object>` 또는 `<json_path>`가 NULL이면 NULL을 반환합니다.
2. `<json_path>`로 지정된 요소가 존재하지 않으면 NULL을 반환합니다.
3. `<json_path>`로 지정된 요소를 INT로 변환할 수 없으면 NULL을 반환합니다.
4. 동작은 "cast + json_extract"와 일치하며, 다음과 동등합니다.
    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as INT)
    ```

## 예제 {#examples}
1. 일반적인 매개변수
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
2. 경로가 존재하지 않는 경우
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
3. NULL 매개변수
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
4. INT로 변환할 수 없는 경우
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
