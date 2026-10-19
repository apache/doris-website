---
{
    "title": "ARRAY_SORTBY",
    "language": "ko",
    "description": "키 배열의 순서에 따라 값 배열을 정렬합니다."
}
---

## 기능 {#function}

`values` 배열을 `keys` 배열의 순서에 따라 정렬합니다.
- 예를 들어, `keys`가 `[3, 0, 2]`이고 `values`가 `[5, 7, 8]`이면, 정렬 후 `keys`는 `[0, 2, 3]`이 되고 이에 대응하는 `values`는 `[7, 8, 5]`가 됩니다.

## 구문 {#syntax}

- `ARRAY_SORTBY(values, keys)`
- `ARRAY_SORTBY(lambda, values)`
- `ARRAY_SORTBY(lambda, values)`는 `ARRAY_SORTBY(values, ARRAY_MAP(lambda, values))`와 동일합니다.

## 매개변수 {#parameters}

- `values`: `ARRAY<T>` 타입의 정렬할 값 배열입니다. `T`는 numeric, boolean, string, datetime, IP 등을 지원합니다. 다차원 배열도 지원하지만, 모든 배열 요소는 중첩 깊이와 관계없이 지원되는 타입이어야 합니다.
- `keys`: `ARRAY<T>` 타입의 키 배열로, `values`와 길이가 같아야 합니다. `T`는 numeric, boolean, string, datetime, IP 등을 지원합니다. 다차원 배열도 지원하지만, 모든 배열 요소는 중첩 깊이와 관계없이 지원되는 타입이어야 합니다.
- `lambda`: `lambda` 표현식으로, `values`에 적용하여 정렬에 사용할 `keys` 배열을 생성합니다.

## 반환값 {#return-value}

- `ARRAY<T>`를 반환하며, `values`와 타입이 같습니다.
- 어느 행에서든 `values`와 `keys`의 요소 개수가 다르면 오류가 발생합니다.

## 사용 시 참고 사항 {#usage-notes}

- 정렬 안정성: `values`는 `keys`의 오름차순에 따라 재정렬됩니다. 키가 같은 요소 간의 상대적인 순서는 정의되어 있지 않습니다.
- 고차 함수 호출에서는 `keys`를 먼저 `ARRAY_MAP`으로 계산한 다음, `values`를 `keys`에 따라 정렬합니다.

## 예제 {#examples}

- 기본 사용법: `values`를 `keys`의 오름차순에 따라 정렬합니다.
  - `ARRAY_SORTBY([10,20,30], [3,1,2])` -> `[20,30,10]`
  - `ARRAY_SORTBY(['a','b','c'], [2,2,1])` -> `['c','a','b']`

- 고차 함수: `keys`를 `lambda`로 계산한 다음 정렬합니다.
  - `ARRAY_SORTBY(x -> x + 1, [3,1,2])` -> `[1,2,3]` (`keys`는 `[4,2,3]`)
  - `ARRAY_SORTBY(x -> x*2 <= 2, [1,2,3])` -> `[2,3,1]` (`keys`는 `[true,false,false]`)

- `keys` 또는 `values`가 `NULL`이면 `values`를 그대로 반환합니다.
  - `array_sortby([10,20,30], NULL)` -> `[10, 20, 30]`
  - `array_sortby(NULL, [2,3])` -> `NULL`

- 다차원 배열 정렬: 키 정렬 규칙은 내부 요소의 타입을 따릅니다.
  - `ARRAY_SORTBY(x -> x[1], [[1,2],[0,1]])` -> `[[0, 1], [1, 2]]`
