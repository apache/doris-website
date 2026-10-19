---
{
    "title": "ARRAY_SPLIT",
    "language": "ko",
    "description": "주어진 boolean 플래그에 따라 입력 배열을 여러 하위 배열로 분할합니다."
}
---

## 기능 {#function}

주어진 boolean 플래그에 따라 입력 배열을 여러 하위 배열로 분할합니다.

- 분할 규칙(왼쪽에서 오른쪽): `arr=[a1,a2,...,an]`와 `flags=[f1,f2,...,fn]`에 대해, `fi==true`인 모든 위치에서 `ai`와 `a(i-1)` 사이를 분할합니다.
  - 예를 들어, `arr=[3, 4, 5]`와 `flags=[false, true, false]`의 경우 두 번째 플래그가 true이므로 첫 번째 요소와 두 번째 요소 사이를 분할하여 두 하위 배열 `[3]`과 `[4,5]`를 생성합니다.

## 구문 {#syntax}

- `ARRAY_SPLIT(arr, flags)`
- `ARRAY_SPLIT(lambda, arr0, ...)`
- `ARRAY_SPLIT(lambda, arr0, ...)`는 `ARRAY_SPLIT(arr0, ARRAY_MAP(lambda, arr0, ...))`와 같습니다.

## 매개변수 {#parameters}

- `arr`: `ARRAY<T>`.
- `flags`: `ARRAY<BOOLEAN>`. 길이는 각 행에서 `arr`의 길이와 일치해야 합니다. `true`는 현재 위치와 다음 요소 사이에서 분할함을 의미합니다.
- `arr0, ...`: 하나 이상의 `ARRAY<T>`.
- `lambda`: `lambda` 표현식으로, `arr0, ...`에 적용하여 `flags`를 생성하고, 생성된 플래그를 분할에 사용합니다.

## 반환값 {#return-value}

- `ARRAY<ARRAY<T>>`를 반환합니다. 내부 배열의 요소는 `arr`의 요소와 같습니다.
- `arr`와 `flags`의 요소 수가 일치하지 않으면 오류가 발생합니다.

## 사용 시 참고 사항 {#usage-notes}

- `flags`의 특정 위치가 `NULL`이면 분할하지 않는 것으로 처리합니다(`false`와 동일).
- `ARRAY_SPLIT`의 분할 규칙: `fi==true`인 각 위치에서 `ai`와 `a(i-1)` 사이를 분할합니다.
- `ARRAY_REVERSE_SPLIT`의 분할 규칙: `fi==true`인 각 위치에서 `ai`와 `a(i+1)` 사이를 분할합니다.

## 예제 {#examples}

- 기본 분할: `true`인 각 위치에서 왼쪽에 인접한 요소와 분리합니다.
  - `ARRAY_SPLIT([1,2,3,4,5], [false,true,false,true,false])` -> `[[1], [2, 3], [4, 5]]`
  - `ARRAY_SPLIT(['a','b','c'], [false,false,false])` -> `[['a','b','c']]`

- `NULL`이 `flags`에 있는 경우: `NULL`은 `false`와 동일하게 처리합니다(분할하지 않음).
  - `ARRAY_SPLIT([1,NULL,3], [false,null,false])` -> `[[1, NULL, 3]]`

- `lambda= x -> x-1`을 `arr0=[1, 2, 3]`에 적용하면 `flags=[0,1,2]`가 생성되며, 이는 `flags=[false,true,true]`와 같습니다
  - `ARRAY_SPLIT(x->x-1, [1, 2, 3])`는 `ARRAY_SPLIT([1, 2, 3], [false,true,true])`와 같습니다 -> `[[1], [2], [3]]`

- `lambda= (x,y) -> x-y`를 `arr0=[1, 2, 3]`과 `arr1=[0,1,2]`에 적용하면 `flags=[true,true,true]`가 생성됩니다
  - `ARRAY_SPLIT((x,y) -> x-y, [1, 2, 3], [0, 1, 2])`는 `ARRAY_SPLIT([1, 2, 3], [true,true,true])`와 같습니다 -> `[[1], [2], [3]]`
