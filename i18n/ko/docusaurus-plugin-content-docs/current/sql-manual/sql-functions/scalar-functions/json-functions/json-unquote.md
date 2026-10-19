---
{
    "title": "JSON_UNQUOTE",
    "language": "ko",
    "description": "이 함수는 JSON 값에서 따옴표를 제거하고 결과를 문자열로 반환합니다. 매개변수가 NULL이면 NULL을 반환합니다."
}
---

## 설명 {#description}
이 함수는 JSON 값에서 따옴표를 제거하고 결과를 문자열로 반환합니다. 매개변수가 NULL이면 NULL을 반환합니다.

특수 문자에는 다음이 포함됩니다:
* 따옴표 (`"`)
* 백슬래시 (`\`)
* 백스페이스	(`\b`)
* 줄 바꿈 (`\n`)
* 캐리지 리턴 (`\r`)
* 수평 탭 (`\t`)

제어 문자에는 다음이 포함됩니다:
* `CHAR(0)`은 `\u0000`으로 이스케이프 처리됩니다.


## 구문 {#syntax}
```sql
JSON_UNQUOTE (<str>)
```

## 매개변수 {#parameters}
- `<str>` 따옴표를 제거할 문자열입니다.

## 반환 값 {#return-value}
문자열을 반환합니다. 특수한 경우는 다음과 같습니다:
* 입력 매개변수가 NULL이면 NULL을 반환합니다.
* 입력 매개변수가 큰따옴표로 둘러싸인 값이 아니면 해당 값을 그대로 반환합니다.
* 입력 매개변수가 문자열이 아니면 자동으로 문자열로 변환한 후 해당 값을 그대로 반환합니다.

## 예제 {#examples}
1. 문자열에서 이스케이프 문자 제거
    ```sql
    select json_unquote('"I am a \\"string\\" that contains double quotes."');
    ```
    ```
    +--------------------------------------------------------------------+
    | json_unquote('"I am a \\"string\\" that contains double quotes."') |
    +--------------------------------------------------------------------+
    | I am a "string" that contains double quotes.                       |
    +--------------------------------------------------------------------+
    ```
2. 특수 문자 이스케이프 처리
    ```sql
    select json_unquote('"\\\\ \\b \\n \\r \\t"');
    ```
    ```
    +----------------------------------------+
    | json_unquote('"\\\\ \\b \\n \\r \\t"') |
    +----------------------------------------+
    | \ 
                                        |
    +----------------------------------------+
    ```
    > 이스케이프 문자가 제거되므로 일부 공백 문자(줄 바꿈, 백스페이스, 탭 등)가 출력됩니다.
3. 제어 문자 이스케이프 처리
    ```sql
    select json_unquote('"\\u0000"');
    ```
    ```
    +---------------------------+
    | json_unquote('"\\u0000"') |
    +---------------------------+
    |                           |
    +---------------------------+
    ```
4. 유효하지 않은 JSON 문자열
    ```sql
    select json_unquote('"I am a "string" that contains double quotes."');
    ```
    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = [RUNTIME_ERROR]Invalid JSON text in argument 1 to function json_unquote: "I am a "string" that contains double quotes."
    ```
5. 따옴표로 시작하지만 따옴표로 끝나지 않는 경우
    ```sql
    select json_unquote('"I am a "string" that contains double quotes.');
    ```
    ```
    +---------------------------------------------------------------+
    | json_unquote('"I am a "string" that contains double quotes.') |
    +---------------------------------------------------------------+
    | "I am a "string" that contains double quotes.                 |
    +---------------------------------------------------------------+
    ```
6. 따옴표로 끝나는 경우
    ```sql
    select json_unquote('I am a "string" that contains double quotes."');
    ```
    ```
    +---------------------------------------------------------------+
    | json_unquote('I am a "string" that contains double quotes."') |
    +---------------------------------------------------------------+
    | I am a "string" that contains double quotes."                 |
    +---------------------------------------------------------------+
    ```
