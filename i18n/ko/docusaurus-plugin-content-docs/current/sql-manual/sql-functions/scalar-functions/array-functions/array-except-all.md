---
{
    "title": "ARRAY_EXCEPT_ALL",
    "language": "ko",
    "description": "두 배열의 다중집합 차집합을 반환하며, 제거되지 않은 중복 원소와 첫 번째 배열의 순서를 유지합니다."
}
---

## array_except_all {#array_except_all}

<version since="dev">

</version>

## 설명 {#description}

`arr1`과 `arr2`의 다중집합 차집합을 반환합니다. `arr2`에 나타나는 각 원소는 `arr1`에서 값이 같은 원소를 최대 하나씩 제거합니다. 남은 원소는 중복을 포함하여 원래 순서를 유지합니다. `NULL` 원소도 나타나는 횟수를 기준으로 비교하여 제거하며, 입력 배열이 `NULL`이면 결과도 `NULL`입니다.

## 구문 {#syntax}

```sql
ARRAY_EXCEPT_ALL(<arr1>, <arr2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<arr1>` | 첫 번째 배열입니다. 원소 타입은 지원되는 스칼라 타입이어야 하며, `<arr2>`의 원소 타입과 호환되어야 합니다. |
| `<arr2>` | 두 번째 배열입니다. 각 원소가 나타날 때마다 `<arr1>`에서 일치하는 원소 하나를 제거합니다. 원소 타입은 지원되는 스칼라 타입이어야 하며, `<arr1>`의 원소 타입과 호환되어야 합니다. |

지원되는 스칼라 원소 타입에는 숫자, 불리언, 문자열, 날짜/시간, IPv4/IPv6 및 UUID 타입이 포함됩니다. `ARRAY`, `MAP`, `STRUCT`, `JSON`, `VARIANT`와 같은 복합 원소 타입은 지원되지 않습니다.

## 반환값 {#return-value}

`ARRAY<T>`를 반환하며, `<arr1>`에서 남은 원소가 원래 순서대로 포함됩니다. 입력 배열 중 하나라도 `NULL`이면 `NULL`을 반환합니다. 남은 원소가 없으면 빈 배열을 반환합니다.

## 예제 {#example}

기본적인 다중집합 차집합:

```sql
SELECT array_except_all([1, 1, 2, 3], [1, 3]);
```

```text
[1, 2]
```

원소를 한 번에 하나씩 제거하므로, 일치하는 원소가 없어 제거되지 않은 중복 원소는 유지됩니다:

```sql
SELECT array_except_all(['a', 'a', 'b'], ['a']);
```

```text
["a", "b"]
```

결과는 첫 번째 배열의 순서를 유지합니다:

```sql
SELECT array_except_all([3, 1, 3, 2], [3]);
```

```text
[1, 3, 2]
```

`NULL` 원소도 다중집합 차집합 연산에 포함됩니다:

```sql
SELECT array_except_all(['a', NULL, 'a', NULL], [NULL]);
```

```text
["a", "a", null]
```

입력 배열 중 하나라도 `NULL`이면 결과는 `NULL`입니다:

```sql
SELECT array_except_all(CAST(NULL AS ARRAY<INT>), [1]);
```

```text
NULL
```

두 번째 배열이 비어 있으면 첫 번째 배열이 그대로 유지됩니다:

```sql
SELECT array_except_all([1, 1, 2], CAST([] AS ARRAY<INT>));
```

```text
[1, 1, 2]
```

`array_except`와 달리 이 함수는 남은 중복 원소를 유지합니다:

```sql
SELECT array_except([1, 1, 2], [1]), array_except_all([1, 1, 2], [1]);
```

```text
[2]    [1, 2]
```

복합 원소 타입은 지원되지 않습니다:

```sql
SELECT array_except_all([[1], [2]], [[1]]);
```

```text
ERROR 1105 (HY000): array_except_all does not support types
```

### 키워드 {#keywords}

ARRAY, EXCEPT, MULTISET, ARRAY_EXCEPT_ALL
