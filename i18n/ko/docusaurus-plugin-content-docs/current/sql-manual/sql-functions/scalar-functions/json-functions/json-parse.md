---
{
    "title": "JSON_PARSE",
    "language": "ko",
    "description": "원시 JSON 문자열을 JSON 바이너리 형식으로 파싱합니다. 다양한 예외 데이터 처리 요구 사항을 충족하기 위해,"
}
---

## 설명 {#description}
원시 JSON 문자열을 JSON 바이너리 형식으로 파싱합니다. 다양한 예외 데이터 처리 요구 사항에 맞춰 다음과 같은 JSON_PARSE 계열 함수를 제공합니다:
* `JSON_PARSE` JSON 문자열을 파싱합니다. 입력 문자열이 유효한 JSON 문자열이 아니면 오류가 발생합니다.
* `JSON_PARSE_ERROR_TO_NULL` JSON 문자열을 파싱합니다. 입력 문자열이 유효한 JSON 문자열이 아니면 NULL을 반환합니다.
* `JSON_PARSE_ERROR_TO_VALUE` JSON 문자열을 파싱합니다. 입력 문자열이 유효한 JSON 문자열이 아니면 default_json_value 매개변수로 지정한 기본값을 반환합니다.

## 구문 {#syntax}

```sql
JSON_PARSE (<json_str>)
```
```sql
JSON_PARSE_ERROR_TO_NULL (<json_str>)
```

```sql
JSON_PARSE_ERROR_TO_VALUE (<json_str>, <default_json_value>)
```

## 매개변수 {#parameters}
### 필수 매개변수 {#required-parameters}
- `<json_str>` 문자열 타입이며, 내용은 유효한 JSON 문자열이어야 합니다.
### 선택적 매개변수 {#optional-parameters}
- `<default_json_value>` JSON 타입이며, NULL일 수 있습니다. `<json_str>` 파싱에 실패하면 `<default_json_value>`가 기본값으로 반환됩니다.

## 반환값 {#return-value}
`Nullable<JSON>` 파싱된 JSON 객체를 반환합니다.

## 사용 시 참고 사항 {#usage-notes}
1. `<json_str>`이 NULL이면 결과도 NULL입니다.
2. `JSON_PARSE`/`JSON_PARSE_ERROR_TO_NULL`/`JSON_PARSE_ERROR_TO_VALUE`는 파싱에 실패했을 때의 결과가 다르다는 점을 제외하면 기본적으로 동일하게 동작합니다.

## 예제 {#examples}
1. 정상적인 JSON 문자열 파싱
    ```sql
    SELECT json_parse('{"k1":"v31","k2":300}');
    ```
    ```text
    +-------------------------------------+
    | json_parse('{"k1":"v31","k2":300}') |
    +-------------------------------------+
    | {"k1":"v31","k2":300}               |
    +-------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_null('{"k1":"v31","k2":300}');
    ```
    ```text
    +---------------------------------------------------+
    | json_parse_error_to_null('{"k1":"v31","k2":300}') |
    +---------------------------------------------------+
    | {"k1":"v31","k2":300}                             |
    +---------------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('{"k1":"v31","k2":300}','{}');
    ```
    ```text
    +---------------------------------------------------------+
    | json_parse_error_to_value('{"k1":"v31","k2":300}','{}') |
    +---------------------------------------------------------+
    | {"k1":"v31","k2":300}                                   |
    +---------------------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('{"k1":"v31","k2":300}', NULL);
    ```
    ```text
    +----------------------------------------------------------+
    | json_parse_error_to_value('{"k1":"v31","k2":300}', NULL) |
    +----------------------------------------------------------+
    | {"k1":"v31","k2":300}                                    |
    +----------------------------------------------------------+
    ```
2. 유효하지 않은 JSON 문자열 파싱
    ```sql
    SELECT json_parse('invalid json');
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]Parse json document failed at row 0, error: [INTERNAL_ERROR]simdjson parse exception:
    ```
    ```sql
    SELECT json_parse_error_to_null('invalid json');
    ```
    ```text
    +------------------------------------------+
    | json_parse_error_to_null('invalid json') |
    +------------------------------------------+
    | NULL                                     |
    +------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('invalid json');
    ```
    ```text
    +-------------------------------------------+
    | json_parse_error_to_value('invalid json') |
    +-------------------------------------------+
    | {}                                        |
    +-------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('invalid json', '{"key": "default value"}');
    ```
    ```text
    +-----------------------------------------------------------------------+
    | json_parse_error_to_value('invalid json', '{"key": "default value"}') |
    +-----------------------------------------------------------------------+
    | {"key":"default value"}                                               |
    +-----------------------------------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('invalid json', NULL);
    ```
    ```text
    +-------------------------------------------------+
    | json_parse_error_to_value('invalid json', NULL) |
    +-------------------------------------------------+
    | NULL                                            |
    +-------------------------------------------------+
    ```
3. NULL 매개변수
    ```sql
    SELECT json_parse(NULL);
    ```
    ```text
    +------------------+
    | json_parse(NULL) |
    +------------------+
    | NULL             |
    +------------------+
    ```
    ```sql
    SELECT json_parse_error_to_null(NULL);
    ```
    ```text
    +--------------------------------+
    | json_parse_error_to_null(NULL) |
    +--------------------------------+
    | NULL                           |
    +--------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value(NULL, '{}');
    ```
    ```text
    +---------------------------------------+
    | json_parse_error_to_value(NULL, '{}') |
    +---------------------------------------+
    | NULL                                  |
    +---------------------------------------+
    ```
