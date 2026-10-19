---
{
    "title": "JSON_TYPE",
    "language": "ko",
    "description": "JSONB 데이터에서 jsonpath로 지정한 필드의 타입을 확인하는 데 사용합니다. 필드가 없으면 NULL을 반환합니다. 필드가 있으면,"
}
---

## 설명 {#description}

JSONB 데이터에서 `json_path`로 지정한 필드의 타입을 확인하는 데 사용합니다. 필드가 없으면 NULL을 반환합니다. 필드가 있으면 다음 타입 중 하나를 반환합니다:

- object
- array
- null
- bool
- int
- bigint
- largeint
- double
- string

## 구문 {#syntax}

```sql
JSON_TYPE( <json>, <json_path> )
```

## 매개변수 {#parameters}

- `<json>` 타입을 확인할 JSON 문자열입니다.
- `<json_path>` JSON 내 필드의 위치를 지정하는 문자열 타입입니다. 경로는 일반적으로 $로 시작하며, .을 사용하여 계층 구조를 나타냅니다.

## 반환값 {#return-value}

`Nullable<String>`: 해당 필드의 타입을 반환합니다.

## 사용 시 참고 사항 {#usage-notes}
- `<json_object>` 또는 `<json_path>`가 NULL이면 NULL을 반환합니다.
- `<json_path>`가 유효한 경로가 아니면 함수에서 오류가 발생합니다.
- `<json_path>`로 지정한 필드가 없으면 NULL을 반환합니다.

## 예제 {#examples}
1. JSON이 문자열 타입인 경우:
    ```sql
    SELECT JSON_TYPE('{"name": "John", "age": 30}', '$.name');
    ```
    ```text
    +-------------------------------------------------------------------+
    | jsonb_type(cast('{"name": "John", "age": 30}' as JSON), '$.name') |
    +-------------------------------------------------------------------+
    | string                                                            |
    +-------------------------------------------------------------------+
    ```

2. JSON이 숫자 타입인 경우:
    ```sql
    SELECT JSON_TYPE('{"name": "John", "age": 30}', '$.age');
    ```
    ```text
    +------------------------------------------------------------------+
    | jsonb_type(cast('{"name": "John", "age": 30}' as JSON), '$.age') |
    +------------------------------------------------------------------+
    | int                                                              |
    +------------------------------------------------------------------+
    ```
3. NULL 매개변수
    ```sql
    select json_type(NULL, '$.key1');
    ```
    ```text
    +---------------------------+
    | json_type(NULL, '$.key1') |
    +---------------------------+
    | NULL                      |
    +---------------------------+
    ```
4. NULL 매개변수 2
    ```sql
    select json_type('{"key1": true}', NULL);
    ```
    ```text
    +-----------------------------------+
    | json_type('{"key1": true}', NULL) |
    +-----------------------------------+
    | NULL                              |
    +-----------------------------------+
    ```
5. `json_path` 매개변수로 지정한 필드가 없는 경우
    ```sql
    select json_type('{"key1": true}', '$.key2');
    ```
    ```text
    +---------------------------------------+
    | json_type('{"key1": true}', '$.key2') |
    +---------------------------------------+
    | NULL                                  |
    +---------------------------------------+
    ```
6. 유효하지 않은 `json_path` 매개변수
    ```sql
    select json_type('{"key1": true}', '$.');
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]Json path error: Invalid Json Path for value: $.
    ```
