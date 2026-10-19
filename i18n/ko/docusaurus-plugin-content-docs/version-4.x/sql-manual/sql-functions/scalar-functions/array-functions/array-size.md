---
{
    "title": "ARRAY_SIZE",
    "language": "ko",
    "description": "배열의 요소 수를 반환합니다."
}
---

## 기능 {#function}

배열의 요소 수를 반환합니다.

## 구문 {#syntax}

- `ARRAY_SIZE(arr)`

## 매개변수 {#parameters}

- `arr`: `ARRAY<T>`.

## 반환값 {#return-value}

- `arr`에 포함된 요소 수를 반환합니다.

## 사용 시 참고 사항 {#usage-notes}

- 입력값 `arr`가 `NULL`이면 `NULL`을 반환합니다.

## 예제 {#examples}

- 배열:
  - `ARRAY_SIZE([1, 2, 3])` -> `3`
  - `ARRAY_SIZE(['a', NULL, 'b'])` -> `3`

- 입력값 `arr`가 `NULL`이면 `NULL`을 반환합니다.
  - `ARRAY_SIZE(NULL)` -> `NULL`
