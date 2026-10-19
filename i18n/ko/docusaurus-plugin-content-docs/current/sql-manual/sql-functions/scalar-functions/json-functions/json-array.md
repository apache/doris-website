---
{
    "title": "JSON_ARRAY",
    "language": "ko",
    "description": "지정된 요소를 포함하는 JSON 배열을 생성합니다. 매개변수를 전달하지 않으면 빈 배열을 반환합니다."
}
---

## 설명 {#description}
지정된 요소를 포함하는 JSON 배열을 생성합니다. 매개변수를 전달하지 않으면 빈 배열을 반환합니다.

## 구문 {#syntax}
```sql
JSON_ARRAY([<expression>, ...]) 
```
## 매개변수 {#parameters}
### 가변 매개변수: {#variable-parameters}
- `<expression>`: JSON 배열에 포함할 요소입니다. NULL을 포함하여 서로 다른 타입의 값을 하나 이상 지정할 수 있습니다.

## 반환값 {#return-value}
[`JSON`](../../../basic-element/sql-data-types/semi-structured/JSON.md): 매개변수 목록으로 구성된 JSON 배열을 반환합니다.

## 사용 시 참고 사항 {#usage-notes}
- JSON_ARRAY는 내부적으로 [`TO_JSON`](./to-json.md) 함수를 암시적으로 호출하여 다양한 타입의 매개변수를 JSON 값으로 변환하므로, 매개변수는 [`TO_JSON`](./to-json.md)이 지원하는 타입이어야 합니다.
- NULL은 JSON null로 변환됩니다. 배열에 null 값을 포함하고 싶지 않다면 [`JSON_ARRAY_IGNORE_NULL`](./json-array-ignore-null.md) 함수를 사용할 수 있습니다.
- 매개변수 타입을 [`TO_JSON`](./to-json.md)이 지원하지 않으면 오류가 발생합니다. 다음과 같이 해당 매개변수를 먼저 String 타입으로 변환할 수 있습니다.
    ```sql
    select JSON_ARRAY(CAST(NOW() as String));
    ```
    > NOW() 함수는 DateTime 타입을 반환하므로 CAST 함수를 사용하여 String 타입으로 변환해야 합니다.
- 매개변수가 JSON 문자열이고 이를 JSON 객체로 배열에 추가하려면 [`JSON_PARSE`](./json-parse.md) 함수를 명시적으로 호출하여 JSON 객체로 파싱해야 합니다.
  ```sql
  select JSON_ARRAY(JSON_PARSE('{"key": "value"}'));
  ```

## 예제 {#examples}
1. 일반 매개변수
    ```sql
    select json_array() as empty_array, json_array(1) v1, json_array(1, 'abc') v2;
    ```
    ```
    +-------------+------+-----------+
    | empty_array | v1   | v2        |
    +-------------+------+-----------+
    | []          | [1]  | [1,"abc"] |
    +-------------+------+-----------+
    ```
2. NULL 매개변수
    ```sql
    select json_array(null) v1, json_array(1, null, 'I am a string') v2;
    ```
    ```
    +--------+--------------------------+
    | v1     | v2                       |
    +--------+--------------------------+
    | [null] | [1,null,"I am a string"] |
    +--------+--------------------------+
    ```
3. 지원되지 않는 매개변수 타입
    ```sql
    select json_array('item1', map(123, 'abc'));
    ```
    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(MAP<TINYINT,VARCHAR(3)>)
    ```
4. Map 타입 매개변수는 JSON으로 명시적으로 변환할 수 있습니다.
    ```sql
    select json_array(1, cast(map('key', 'value') as json));
    ```
    ```
    +--------------------------------------------------+
    | json_array(1, cast(map('key', 'value') as json)) |
    +--------------------------------------------------+
    | [1,{"key":"value"}]                              |
    +--------------------------------------------------+
    ```
5. JSON 문자열은 문자열 형태로 배열에 추가됩니다.
    ```sql
    select json_array('{"key1": "value", "key2": [1, "I am a string", 3]}');
    ```
    ```
    +------------------------------------------------------------------+
    | json_array('{"key1": "value", "key2": [1, "I am a string", 3]}') |
    +------------------------------------------------------------------+
    | ["{\"key1\": \"value\", \"key2\": [1, \"I am a string\", 3]}"]   |
    +------------------------------------------------------------------+
    ```
6. JSON 문자열은 `json_parse`로 파싱한 후 `json_array`에 전달할 수 있습니다.
    ```sql
    select json_array(json_parse('{"key1": "value", "key2": [1, "I am a string", 3]}'));
    ```
    ```
    +------------------------------------------------------------------------------+
    | json_array(json_parse('{"key1": "value", "key2": [1, "I am a string", 3]}')) |
    +------------------------------------------------------------------------------+
    | [{"key1":"value","key2":[1,"I am a string",3]}]                              |
    +------------------------------------------------------------------------------+
    ```
