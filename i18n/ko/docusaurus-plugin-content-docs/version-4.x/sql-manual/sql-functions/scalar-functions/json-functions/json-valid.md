---
{
    "title": "JSON_VALID",
    "language": "ko",
    "description": "JSONVALID 함수는 입력이 유효한 JSON인지 여부를 나타내는 0 또는 1을 반환합니다. 입력이 NULL이면 NULL을 반환합니다."
}
---

## 설명 {#description}

JSON_VALID 함수는 입력이 유효한 JSON 형식인지 검사하는 데 사용됩니다. 이 함수는 String 타입 또는 JSON 타입의 입력을 받아 JSON 형식의 유효성을 검사합니다.

## 구문 {#syntax}

```sql
JSON_VALID(<str>)
JSON_VALID(<json>)
```

## 매개변수 {#parameters}

- `<str>`: String 타입, 유효성을 검사할 JSON 형식의 문자열
- `<json>`: JSON 타입, 유효성을 검사할 JSON 값

## 반환값 {#return-values}

- `1`: 입력이 유효한 JSON 형식인 경우
- `0`: 입력이 유효한 JSON 형식이 아닌 경우
- `NULL`: 입력 매개변수가 NULL인 경우

## 참고 사항 {#notes}

JSON 타입 매개변수를 지원하는 이유는 JSON 열을 전달할 때 암시적 타입 변환(JSON에서 String으로)으로 인해 발생할 수 있는 문제를 방지하기 위해서입니다. 일반적으로 JSON 타입 열에 저장된 데이터는 유효한 JSON 데이터이므로, JSON 타입 매개변수로 JSON_VALID를 호출하면 대개 1을 반환합니다.

## 별칭 {#alias}

- JSONB_VALID

## 예제 {#examples}

1. 유효한 JSON 문자열 검사
    ```sql
    SELECT json_valid('{"k1":"v31","k2":300}');
    ```
    ```text
    +-------------------------------------+
    | json_valid('{"k1":"v31","k2":300}') |
    +-------------------------------------+
    |                                   1 |
    +-------------------------------------+
    ```

2. 유효하지 않은 JSON 문자열 검사
    ```sql
    SELECT json_valid('invalid json');
    ```
    ```text
    +----------------------------+
    | json_valid('invalid json') |
    +----------------------------+
    |                          0 |
    +----------------------------+
    ```

3. NULL 매개변수 검사
    ```sql
    SELECT json_valid(NULL);
    ```
    ```text
    +------------------+
    | json_valid(NULL) |
    +------------------+
    |             NULL |
    +------------------+
    ```

4. JSON 타입 매개변수 검사
    ```sql
    SELECT json_valid(cast('{"k1":"v31","k2":300}' as json));
    ```
    ```text
    +----------------------------------------------------+
    | json_valid(cast('{"k1":"v31","k2":300}' as json)) |
    +----------------------------------------------------+
    |                                                  1 |
    +----------------------------------------------------+
    ```
