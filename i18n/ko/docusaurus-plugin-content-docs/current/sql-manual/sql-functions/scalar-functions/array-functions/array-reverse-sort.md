---
{
    "title": "ARRAY_REVERSE_SORT",
    "language": "ko",
    "description": "배열 요소를 내림차순으로 정렬합니다."
}
---

## 기능 {#function}

배열 요소를 내림차순으로 정렬합니다.

## 구문 {#syntax}

- `ARRAY_REVERSE_SORT(arr)`

## 매개변수 {#parameters}

- `arr`: `ARRAY<T>` 타입이며, `T`는 numeric, boolean, string, datetime, IP, UUID 등의 타입일 수 있습니다. 다차원 배열을 지원하지만, 중첩 깊이와 관계없이 모든 배열 요소는 지원되는 타입이어야 합니다.

## 반환 값 {#return-value}

- 입력과 동일한 타입의 `ARRAY<T>`를 반환합니다.
- `NULL` 요소는 반환되는 배열의 끝에 배치됩니다.

## 사용 시 참고 사항 {#usage-notes}

- 입력이 `NULL`이면 `NULL`을 반환하고, 입력이 빈 배열 `[]`이면 빈 배열을 반환합니다.
- `ARRAY_REVERSE_SORT`는 내림차순으로 정렬하고, `ARRAY_SORT`는 오름차순으로 정렬합니다.

## 예제 {#examples}

- 기본: `NULL` 요소는 반환되는 배열의 끝에 배치됩니다
  - `ARRAY_REVERSE_SORT([1,2,3,null])` -> `[3,2,1,null]`

- 입력이 `NULL`이면 `NULL`을 반환하고, 입력이 빈 배열 `[]`이면 빈 배열을 반환합니다.
  - `ARRAY_REVERSE_SORT(NULL)` -> `NULL`
  - `ARRAY_REVERSE_SORT([])` -> `[]`

- 다차원 배열 정렬
  - `ARRAY_REVERSE_SORT([[3, 4], [5, 6]])` -> `[[5, 6], [3, 4]]`
