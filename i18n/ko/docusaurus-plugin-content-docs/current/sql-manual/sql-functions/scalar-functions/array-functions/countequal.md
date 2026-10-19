---
{
    "title": "COUNTEQUAL",
    "language": "ko",
    "description": "배열에서 지정된 대상 값과 같은 요소의 개수를 셉니다."
}
---

## 기능 {#function}

배열에서 지정된 대상 값과 같은 요소의 개수를 셉니다.

## 구문 {#syntax}

- `COUNTEQUAL(arr, target)`

## 매개변수 {#parameters}

- `arr`: `ARRAY<T>` 타입이며, 지원되는 요소 타입은 numeric, boolean, string, datetime, IP, UUID입니다.
- `target`: `arr`의 요소와 같은 타입입니다.

## 반환 값 {#return-value}

- `BIGINT`를 반환하며, 값이 같은 요소의 개수를 나타냅니다.

## 사용 시 참고 사항 {#usage-notes}

- 이 함수에서는 `NULL`을 `NULL`과 같은 값으로 간주하여 개수에 포함합니다.

## 예제 {#examples}

- 기본 예제
  - `COUNTEQUAL([1,2,3,2], 2)` -> `2`
  - `COUNTEQUAL(['a','b','a'], 'a')` -> `2`
  - `COUNTEQUAL([true,false,false], false)` -> `2`

- `NULL`도 같은 값으로 간주하여 개수에 포함합니다
  - `COUNTEQUAL([1,NULL,2,NULL], NULL)` -> `2`
  - `COUNTEQUAL([1,NULL,1], 1)` -> `2`
  - `COUNTEQUAL([1, 2], NULL)` -> `0`

- 배열이 `NULL`이면 `NULL`을 반환합니다
  - `COUNTEQUAL(NULL, 1)` -> `NULL`
