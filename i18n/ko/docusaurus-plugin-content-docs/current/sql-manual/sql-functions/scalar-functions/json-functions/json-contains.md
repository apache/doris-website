---
{
    "title": "JSON_CONTAINS",
    "language": "ko",
    "description": "JSON 문서에 지정된 JSON 요소가 포함되어 있는지 확인하는 데 사용됩니다. 지정된 요소가 JSON 문서에 있으면 1을 반환합니다."
}
---

## 설명 {#description}

JSON 문서에 지정된 JSON 요소가 포함되어 있는지 확인하는 데 사용됩니다. 지정된 요소가 JSON 문서에 있으면 1을 반환하고, 없으면 0을 반환합니다. JSON 문서나 쿼리 대상 요소가 유효하지 않으면 `NULL`을 반환합니다.

## 구문 {#syntax}

```sql
JSON_CONTAINS(<json_object>, <candidate>[, <json_path>])
```

## 매개변수 {#parameters}
### 필수 매개변수 {#required-parameters}
- `<json_object>` JSON 타입으로, 이 값에 `<candidate>`가 포함되어 있는지 확인합니다.
- `<candidate>` JSON 타입으로, 포함 여부를 확인할 후보 값입니다.
### 선택적 매개변수 {#optional-parameters}
- `<json_path>` String 타입으로, 검색을 시작할 경로입니다. 지정하지 않으면 기본적으로 루트에서 시작합니다.

## 반환 값 {#return-value}
- Null: 세 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- True: `<json_object>`에 `<candidate>`가 포함되어 있으면 True를 반환합니다.
- False: `<json_object>`에 `<candidate>`가 포함되어 있지 않으면 False를 반환합니다.
- `<json_object>` 또는 `<candidate>`가 JSON 타입이 아니면 오류가 발생합니다.

## 예제 {#examples}
1. 예제 1
    ```sql
    SET @j = '{"a": 1, "b": 2, "c": {"d": 4}}';
    SET @j2 = '1';
    SELECT JSON_CONTAINS(@j, @j2, '$.a');
    ```
    ```text
    +-------------------------------+
    | JSON_CONTAINS(@j, @j2, '$.a') |
    +-------------------------------+
    |                             1 |
    +-------------------------------+
    ```
    ```sql
    SELECT JSON_CONTAINS(@j, @j2, '$.b');
    ```
    ```text
    +-------------------------------+
    | JSON_CONTAINS(@j, @j2, '$.b') |
    +-------------------------------+
    |                             0 |
    +-------------------------------+
    ```
    ```sql
    SELECT JSON_CONTAINS(@j, '{"a": 1}');
    ```
    ```text
    +-------------------------------+
    | JSON_CONTAINS(@j, '{"a": 1}') |
    +-------------------------------+
    |                             1 |
    +-------------------------------+
    ```
2. NULL 매개변수
    ```sql
    SELECT JSON_CONTAINS(NULL, '{"a": 1}');
    ```
    ```text
    +---------------------------------+
    | JSON_CONTAINS(NULL, '{"a": 1}') |
    +---------------------------------+
    |                            NULL |
    +---------------------------------+
    ```
    ```sql
    SELECT JSON_CONTAINS('{"a": 1}', NULL);
    ```
    ```text
    +---------------------------------+
    | JSON_CONTAINS('{"a": 1}', NULL) |
    +---------------------------------+
    |                            NULL |
    +---------------------------------+
    ```
    ```sql
    SELECT JSON_CONTAINS('{"a": 1}', '{"a": 1}', NULL);
    ```
    ```text
    +---------------------------------------------+
    | JSON_CONTAINS('{"a": 1}', '{"a": 1}', NULL) |
    +---------------------------------------------+
    |                                        NULL |
    +---------------------------------------------+
    ```
