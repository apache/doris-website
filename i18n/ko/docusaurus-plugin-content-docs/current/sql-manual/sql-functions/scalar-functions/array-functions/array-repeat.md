---
{
    "title": "ARRAY_REPEAT",
    "language": "ko",
    "description": "ARRAYREPEAT는 모든 요소가 지정된 값인 지정된 길이의 배열을 생성하는 데 사용됩니다."
}
---

## 기능 {#function}

`ARRAY_REPEAT`는 모든 요소가 지정된 값인 지정된 길이의 배열을 생성하는 데 사용됩니다.

## 구문 {#syntax}

```SQL
ARRAY_REPEAT(element, count)
```

## 매개변수 {#parameters}

- `element`: `ARRAY`에서 지원하는 모든 저장 타입을 사용할 수 있습니다.

- `count`: 정수 타입으로, 반환되는 배열의 길이를 지정합니다.


## 반환 값 {#return-value}

- `ARRAY<T>` 타입의 배열을 반환합니다. 여기서 `T`는 `element`의 타입입니다.
    - 배열에는 `count`개의 동일한 `element`가 포함됩니다.

## 사용 시 참고 사항 {#usage-notes}

- `count = 0` 또는 `NULL`이면 빈 배열을 반환합니다.
- `element`가 `NULL`이면 배열의 모든 요소는 `NULL`입니다.
- 이 함수는 `ARRAY_WITH_CONSTANT`와 기능이 같지만 매개변수 순서가 반대입니다.

## 예제 {#examples}

1. 간단한 예제

    ```SQL
    SELECT ARRAY_REPEAT('hello', 3);
    +---------------------------------+
    | ARRAY_REPEAT('hello', 3) |
    +---------------------------------+
    | ["hello", "hello", "hello"]     |
    +---------------------------------+
    ```

2. 특수한 경우
   
    ```SQL
    SELECT ARRAY_REPEAT('hello', 0);
    +---------------------------------+
    | ARRAY_REPEAT('hello', 0) |
    +---------------------------------+
    | []                              |
    +---------------------------------+

    SELECT ARRAY_REPEAT('hello', NULL);
    +------------------------------------+
    | ARRAY_REPEAT('hello', NULL) |
    +------------------------------------+
    | []                                 |
    +------------------------------------+

    SELECT ARRAY_REPEAT(NULL, 2);
    +------------------------------+
    | ARRAY_REPEAT(NULL, 2) |
    +------------------------------+
    | [null, null]                 |
    +------------------------------+

    SELECT ARRAY_REPEAT(NULL, NULL);
    +---------------------------------+
    | ARRAY_REPEAT(NULL, NULL) |
    +---------------------------------+
    | []                              |
    +---------------------------------+

    -- Returns error: INVALID_ARGUMENT
    SELECT ARRAY_REPEAT('hello', -1);
    ```
