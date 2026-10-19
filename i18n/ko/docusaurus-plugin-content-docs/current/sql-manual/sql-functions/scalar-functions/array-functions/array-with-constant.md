---
{
    "title": "ARRAY_WITH_CONSTANT",
    "language": "ko",
    "description": "ARRAYWITHCONSTANT는 모든 요소가 지정된 값을 갖는, 지정된 길이의 배열을 생성하는 데 사용됩니다."
}
---

## 기능 {#function}

`ARRAY_WITH_CONSTANT`는 모든 요소가 지정된 값을 갖는, 지정된 길이의 배열을 생성하는 데 사용됩니다.

## 구문 {#syntax}

```SQL
ARRAY_WITH_CONSTANT(count, element)
```

## 매개변수 {#parameters}

- `count`: 정수 타입으로, 반환되는 배열의 길이를 지정합니다.

- `element`: `ARRAY`에서 지원하는 모든 저장 타입을 사용할 수 있습니다.

## 반환값 {#return-value}

- `ARRAY<T>` 타입의 배열을 반환하며, `T`는 `element`의 타입입니다.
    - 배열에는 `count`개만큼 동일한 `element`가 포함됩니다.

## 사용 시 참고 사항 {#usage-notes}

- `count = 0` 또는 `NULL`이면 빈 배열을 반환합니다.
- `element`가 `NULL`이면 배열의 모든 요소가 `NULL`입니다.
- 이 함수는 `ARRAY_REPEAT`와 기능이 같지만 매개변수 순서가 반대입니다.
- 다른 배열 함수와 조합하여 더 복잡한 데이터를 구성할 수 있습니다.

## 예제 {#examples}

1. 간단한 예제

    ```SQL
    SELECT ARRAY_WITH_CONSTANT(3, 'hello');
    +---------------------------------+
    | ARRAY_WITH_CONSTANT(3, 'hello') |
    +---------------------------------+
    | ["hello", "hello", "hello"]     |
    +---------------------------------+
    ```

2. 특수한 경우
   
    ```SQL
    SELECT ARRAY_WITH_CONSTANT(0, 'hello');
    +---------------------------------+
    | ARRAY_WITH_CONSTANT(0, 'hello') |
    +---------------------------------+
    | []                              |
    +---------------------------------+

    SELECT ARRAY_WITH_CONSTANT(NULL, 'hello');
    +------------------------------------+
    | ARRAY_WITH_CONSTANT(NULL, 'hello') |
    +------------------------------------+
    | []                                 |
    +------------------------------------+

    SELECT ARRAY_WITH_CONSTANT(2, NULL);
    +------------------------------+
    | ARRAY_WITH_CONSTANT(2, NULL) |
    +------------------------------+
    | [null, null]                 |
    +------------------------------+

    SELECT ARRAY_WITH_CONSTANT(NULL, NULL);
    +---------------------------------+
    | ARRAY_WITH_CONSTANT(NULL, NULL) |
    +---------------------------------+
    | []                              |
    +---------------------------------+

    -- Returns error: INVALID_ARGUMENT
    SELECT ARRAY_WITH_CONSTANT(-1, 'hello');
    ```
