---
{
    "title": "ARRAY_REMOVE",
    "language": "ko",
    "description": "배열에서 주어진 값과 같은 모든 요소를 제거하고, 나머지 요소의 상대적 순서를 유지합니다."
}
---

## 기능 {#function}

배열에서 주어진 값과 같은 모든 요소를 제거하고, 나머지 요소의 상대적 순서를 유지합니다.

## 구문 {#syntax}

- `ARRAY_REMOVE(arr, target)`

## 매개변수 {#parameters}

- `arr`: `ARRAY<T>`이며, 숫자, boolean, string, datetime, IP 등을 지원합니다.
- `target`: 배열 요소와 같은 타입의 값으로, 제거할 요소를 찾는 데 사용합니다.

## 반환값 {#return-value}

- 입력과 같은 타입의 `ARRAY<T>`를 반환합니다.
- `arr`가 `NULL`이면 `NULL`을 반환합니다.

## 사용 시 참고 사항 {#usage-notes}

- 일치 규칙: 값이 `target`과 같은 요소만 제거합니다. `NULL`은 `NULL`과 같습니다.

## 예시 {#examples}

- 기본: 요소를 제거한 후에도 나머지 요소의 원래 상대적 순서가 유지됩니다.
  - `ARRAY_REMOVE([1,2,3], 1)` -> `[2,3]`
  - `ARRAY_REMOVE([1,2,3,null], 1)` -> `[2,3,null]`

- `target`이 `NULL`이면 `NULL`을 `arr`에서 제거합니다.
  - `ARRAY_REMOVE(['a','b','c',NULL], NULL)` -> `NULL`

- `arr`가 `NULL`이면 `NULL`을 반환합니다.
  - `ARRAY_REMOVE(NULL, 2)` -> `NULL`

- 일치하는 요소가 없는 경우
  - `ARRAY_REMOVE([1,2,3], 258)` -> `[1,2,3]`
