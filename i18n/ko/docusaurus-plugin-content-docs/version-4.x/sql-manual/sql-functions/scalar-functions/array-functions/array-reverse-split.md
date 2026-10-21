---
{
    "title": "ARRAY_REVERSE_SPLIT",
    "language": "ko",
    "description": "주어진 불리언 플래그에 따라 입력 배열을 여러 하위 배열로 분할합니다."
}
---

## 기능 {#function}

주어진 불리언 플래그에 따라 입력 배열을 여러 하위 배열로 분할합니다.

- 분할 규칙(왼쪽에서 오른쪽으로): `arr=[a1,a2,...,an]`와 `flags=[f1,f2,...,fn]`에서 `fi==true`인 각 위치마다 `ai`와 `a(i+1)` 사이를 분할합니다.
  - 예를 들어, `arr=[3, 4, 5]`와 `flags=[false, true, false]`에서 두 번째 플래그가 true이므로 두 번째 요소와 세 번째 요소 사이를 분할하여 두 개의 하위 배열 `[3, 4]`와 `[5]`를 만듭니다.

## 구문 {#syntax}

- `ARRAY_REVERSE_SPLIT(arr, flags)`
- `ARRAY_REVERSE_SPLIT(lamda, arr0, ...)`
- `ARRAY_REVERSE_SPLIT(lambda, arr0, ...)`는 `ARRAY_REVERSE_SPLIT(arr0, ARRAY_MAP(lambda, arr0, ...))`와 동일합니다.

## 매개변수 {#parameters}

- `arr`: `ARRAY<T>`.
- `flags`: `ARRAY<BOOLEAN>`이며, 각 행에서 길이가 `arr`의 길이와 일치해야 합니다. `true`는 현재 위치의 요소와 다음 요소 사이를 분할함을 의미합니다.
- `arr0, ...`: 하나 이상의 `ARRAY<T>`.
- `lambda`: `lambda` 표현식을 `arr0, ...`에 적용하여 `flags`를 생성하고, 이를 기준으로 분할합니다.

## 반환값 {#return-value}

- `ARRAY<ARRAY<T>>`를 반환합니다. 내부 배열의 요소는 `arr`의 요소와 동일합니다.
- `arr`와 `flags`의 요소 수가 일치하지 않으면 오류가 발생합니다.

## 사용 시 참고 사항 {#usage-notes}

- `flags`의 특정 위치가 `NULL`이면 분할하지 않는 것으로 처리합니다(`false`와 동일).
- `ARRAY_REVERSE_SPLIT`의 분할 규칙: `fi==true`인 각 위치에서 `ai`와 `a(i+1)` 사이를 분할합니다.
- `ARRAY_SPLIT`의 분할 규칙: `fi==true`인 각 위치에서 `ai`와 `a(i-1)` 사이를 분할합니다.

## 예제 {#examples}

- 기본 분할: `true`인 각 위치의 요소와 바로 오른쪽 요소 사이를 분할합니다.
  - `ARRAY_REVERSE_SPLIT([1,2,3,4,5], [false,true,false,true,false])` -> `[[1,2], [3,4], [5]]`
  - `ARRAY_REVERSE_SPLIT(['a','b','c'], [false,false,false])` -> `[['a','b','c']]`

- `NULL`이 포함된 `flags`: `NULL`은 `false`와 동일하게 처리합니다(분할하지 않음).
  - `ARRAY_REVERSE_SPLIT([1,NULL,3], [false,null,false])` -> `[[1, NULL, 3]]`

- `lambda= x -> x-1`을 `arr=[1, 2, 3]`에 적용하면 `flags=[0,1,2]`가 생성되며, 이는 `flags=[false,true,true]`와 동일합니다.
  - `ARRAY_REVERSE_SPLIT(x->x-1, [1, 2, 3])`는 `ARRAY_REVERSE_SPLIT([1, 2, 3], [false,true,true])`와 동일합니다. -> `[[1, 2], [3]]`

- `lambda= (x,y) -> x-y`를 `arr=[1, 2, 3]`과 `arr1=[0,1,2]`에 적용하면 `flags=[true,true,true]`가 생성됩니다.
  - `ARRAY_REVERSE_SPLIT((x,y) -> x-y, [1, 2, 3], [0, 1, 2])`는 `ARRAY_REVERSE_SPLIT([1, 2, 3], [true,true,true])`와 동일합니다. -> `[[1], [2], [3]]`
