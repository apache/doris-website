---
{
    "title": "DEDUPLICATE_MAP",
    "language": "ko",
    "description": "Map에서 중복 키를 제거합니다. 기본적으로 Doris는 생성된 Map의 중복을 제거합니다(예: 데이터를 가져올 때). 다만,"
}
---

## 설명 {#description}

Map에서 중복 키를 제거합니다.
기본적으로 Doris는 생성된 Map의 중복을 제거합니다(예: 데이터를 가져올 때).
다만, 외부 테이블에서 읽은 데이터나 문자열에서 변환한 Map처럼 특정 상황에서 얻은 Map은 중복이 제거되지 않을 수 있습니다.
이 함수를 사용하면 Map 타입의 중복을 제거할 수 있습니다.

## 구문 {#syntax}

```sql
DEDUPLICATE_MAP(<map>)
```

## 매개변수 {#parameters}

- `<map>`: 입력 Map의 내용입니다.

## 반환 값 {#return-value}

`Map`: 중복이 제거된 Map을 반환합니다(타입은 입력 매개변수의 타입과 동일합니다).

## 예제 {#examples}
    ```sql
    select m, deduplicate_map(m) from (select cast('{"a": 123, "a": 345}' as map<string, int>) m ) t;
    ```

    ```text
    +--------------------+--------------------+
    | m                  | deduplicate_map(m) |
    +--------------------+--------------------+
    | {"a":123, "a":345} | {"a":345}          |
    +--------------------+--------------------+
    ```
> 문자열에서 변환한 Map은 중복이 제거되지 않습니다.
