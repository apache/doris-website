---
{
    "title": "JSON_OBJECT",
    "language": "ko",
    "description": "지정된 키-값 쌍을 포함하는 JSON 객체 하나를 생성합니다."
}
---

## 설명 {#description}

지정된 키-값 쌍을 포함하는 JSON 객체 하나를 생성합니다. 키 값이 NULL이거나 전달된 매개변수의 개수가 홀수이면 오류를 반환합니다.

## 구문 {#syntax}

```sql
JSON_OBJECT (<key>, <value>[, <key>, <value>, ...])
```

```sql
JSON_OBJECT(*)
```

## 매개변수 {#parameters}
### 가변 매개변수: {#variable-parameters}
- `<key>`: String 타입
- `<value>`: 여러 타입을 지원하며, Doris는 JSON 타입이 아닌 매개변수를 [`TO_JSON`](./to-json.md) 함수를 통해 JSON 타입으로 자동 변환합니다.
- `*`: 별표(와일드카드)로 호출하면 속성 이름을 키로, 해당 값을 값으로 사용하여 지정된 데이터로 OBJECT 값을 구성합니다.

    함수에 와일드카드를 전달할 때 테이블 이름이나 별칭으로 와일드카드를 한정할 수 있습니다. 예를 들어 mytable이라는 테이블의 모든 열을 전달하려면 다음과 같이 지정합니다:

    ```sql
    (mytable.*)
    ```

## 참고 사항 {#notes}
- 매개변수의 개수는 짝수여야 하며, 0개일 수도 있습니다(빈 JSON 객체를 반환합니다).
- 관례에 따라 매개변수 목록은 키와 값이 번갈아 나오는 형태로 구성됩니다.
- 키는 JSON 정의에 따라 텍스트로 강제 변환됩니다.
- 전달된 키가 NULL이면 예외 오류를 반환합니다.
- 값 매개변수는 JSON으로 변환 가능한 방식으로 변환되며, [`TO_JSON`](./to-json.md)에서 지원하는 타입이어야 합니다.
- 전달된 값이 NULL이면 반환되는 JSON 객체에서 해당 키-값 쌍의 값은 JSON null 값이 됩니다.
- 다른 타입을 값으로 사용하려면 CAST를 사용하여 JSON/String으로 변환할 수 있습니다.
- Doris는 현재 JSON 객체의 중복을 제거하지 않으므로 중복 키가 허용됩니다. 다만 중복 키는 예상치 못한 결과를 초래할 수 있습니다:
    1. 다른 시스템에서 중복 키에 해당하는 값을 버리거나 오류를 보고할 수 있습니다.
    2. [`JSON_EXTRACT`](./json-extract.md)가 반환하는 결과는 불확실합니다.

## 반환값 {#return-value}

[`JSON`](../../../basic-element/sql-data-types/semi-structured/JSON.md): 매개변수 목록으로 구성된 JSON 객체를 반환합니다.

## 예제 {#examples}
1. 매개변수가 없는 경우
    ```sql
    select json_object();
    ```
    ```text
    +---------------+
    | json_object() |
    +---------------+
    | {}            |
    +---------------+
    ```
2. 지원되지 않는 값 타입 
    ```sql
    select json_object('time',curtime());
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(TIMEV2(0))
    ```
    cast를 통해 String으로 변환할 수 있습니다
    ```sql
    select json_object('time', cast(curtime() as string));
    ```
    ```text
    +------------------------------------------------+
    | json_object('time', cast(curtime() as string)) |
    +------------------------------------------------+
    | {"time":"17:09:42"}                            |
    +------------------------------------------------+
    ```
3. String 타입이 아닌 키는 String으로 변환됩니다
    ```sql
    SELECT json_object(123, 456);
    ```
    ```text
    +-----------------------+
    | json_object(123, 456) |
    +-----------------------+
    | {"123":456}           |
    +-----------------------+
    ```
4. Null은 키로 사용할 수 없습니다
    ```sql
    select json_object(null, 456);
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = json_object key can't be NULL: json_object(NULL, 456)
    ```
    Null은 값으로 사용할 수 있습니다
    ```sql
    select json_object('key', null);
    ```
    ```text
    +--------------------------+
    | json_object('key', null) |
    +--------------------------+
    | {"key":null}             |
    +--------------------------+
    ```

5. JSON 문자열은 [`JSON_PARSE`](./json-parse.md)를 통해 JSON 객체로 파싱한 후 `JSON_OBJECT`에 전달할 수 있습니다
    ```sql
    select json_object(123, json_parse('{"key": "value"}'));
    ```
    ```text
    +--------------------------------------------------+
    | json_object(123, json_parse('{"key": "value"}')) |
    +--------------------------------------------------+
    | {"123":{"key":"value"}}                          |
    +--------------------------------------------------+
    ```
    그렇지 않으면 문자열로 처리됩니다
    ```sql
    select json_object(123,'{"key": "value"}');
    ```
    ```text
    +-------------------------------------+
    | json_object(123,'{"key": "value"}') |
    +-------------------------------------+
    | {"123":"{\"key\": \"value\"}"}      |
    +-------------------------------------+
    ```
6. [`TO_JSON`](./to-json.md)에서 지원하지 않는 타입
    ```sql
    select json_object('key', map('abc', 'efg'));
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(MAP<VARCHAR(3),VARCHAR(3)>)
    ```

    전달하기 전에 CAST 문을 통해 JSON으로 변환할 수 있습니다:
    ```sql
    select json_object('key', cast(map('abc', 'efg') as json));
    ```
    ```text
    +-----------------------------------------------------+
    | json_object('key', cast(map('abc', 'efg') as json)) |
    +-----------------------------------------------------+
    | {"key":{"abc":"efg"}}                               |
    +-----------------------------------------------------+
    ```
7. 중복 키가 있는 경우
    ```sql
    select
        json_object('key', 123, 'key', 4556) v1
        , jsonb_extract(json_object('key', 123, 'key', 4556), '$.key') v2
        , jsonb_extract(json_object('key', 123, 'key', 4556), '$.*') v3;
    ```
    ```text
    +------------------------+------+------------+
    | v1                     | v2   | v3         |
    +------------------------+------+------------+
    | {"key":123,"key":4556} | 123  | [123,4556] |
    +------------------------+------+------------+
    ```
