---
{
    "title": "JSON_EXTRACT_ISNULL",
    "language": "ko",
    "description": "JSONEXTRACTISNULL은 JSON 객체에서 <jsonpath>로 지정한 필드가 null 값인지 확인합니다."
}
---

## 설명 {#description}
`JSON_EXTRACT_ISNULL`은 JSON 객체에서 `<json_path>`로 지정한 필드가 null 값인지 확인합니다.

## 구문 {#syntax}
```sql
JSON_EXTRACT_ISNULL(<json_object>, <json_path>)
```

## 매개변수 {#parameters}
- `<json_object>`: JSON 타입으로, 값을 추출할 대상 매개변수입니다.
- `<json_path>`: String 타입으로, 대상 JSON에서 대상 요소를 추출할 JSON 경로입니다.

## 반환값 {#return-value}
`Nullable(BOOL)` 값이 null이면 true를 반환하고, 그렇지 않으면 false를 반환합니다.

## 사용 시 참고 사항 {#usage-notes}
1. `<json_object>` 또는 `<json_path>`가 NULL이면 NULL을 반환합니다.
2. `<json_path>`로 지정한 요소가 존재하지 않으면 NULL을 반환합니다.
3. `<json_path>`로 지정한 요소가 null이 아니면 false를 반환합니다.

## 예제 {#examples}
1. 일반 매개변수
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
2. 경로가 존재하지 않는 경우
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
3. NULL 매개변수
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
