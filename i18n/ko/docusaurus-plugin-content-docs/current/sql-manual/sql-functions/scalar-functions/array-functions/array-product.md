---
{
    "title": "ARRAY_PRODUCT",
    "language": "ko",
    "description": "배열의 모든 요소의 곱을 계산합니다. 이 함수는 배열의 모든 요소를 순회하며 이들을 모두 곱합니다."
}
---

## array_product {#array_product}

<version since="2.0.0">

</version>

## 설명 {#description}

배열의 모든 요소의 곱을 계산합니다. 이 함수는 배열의 모든 요소를 순회하며 이들을 모두 곱한 결과를 반환합니다.

## 구문 {#syntax}

```sql
array_product(ARRAY<T> arr)
```

### 매개변수 {#parameters}

- `arr`：ARRAY<T> 타입으로, 요소의 곱을 계산할 배열입니다.

**지원되는 T의 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 불리언 타입: BOOLEAN (true는 1로, false는 0으로 변환됩니다)

### 반환 값 {#return-value}

반환 타입: DOUBLE 또는 DECIMAL

반환 값의 의미:
- 배열의 모든 요소의 곱을 반환합니다.
- NULL: 배열이 비어 있거나, 배열이 NULL이거나, 모든 요소가 NULL인 경우

사용 시 참고 사항:
- 함수는 배열의 NULL 값을 건너뛰고 NULL이 아닌 요소만 곱합니다.
- 배열의 모든 요소가 NULL이면 NULL을 반환합니다.
- 빈 배열은 NULL을 반환합니다.
- 복합 타입(MAP, STRUCT, ARRAY)은 곱 계산을 지원하지 않으며 오류가 발생합니다.
- 배열 요소의 null 값: null 요소는 곱 계산에 참여하지 않습니다.

**쿼리 예제:**

정수 배열의 요소의 곱 계산:
```sql
SELECT array_product([1, 2, 3, 4, 5]);
+--------------------------------+
| array_product([1, 2, 3, 4, 5]) |
+--------------------------------+
|                            120 |
+--------------------------------+
```

부동 소수점 배열의 요소의 곱 계산:
```sql
SELECT array_product([1.1, 2.2, 3.3, 4.4, 5.5]);
+------------------------------------------+
| array_product([1.1, 2.2, 3.3, 4.4, 5.5]) |
+------------------------------------------+
|                                 193.2612 |
+------------------------------------------+
```

null 값이 포함된 배열의 요소의 곱 계산:
```sql
SELECT array_product([1, null, 3, null, 5]);
+----------------------------------------+
| array_product([1, null, 3, null, 5])  |
+----------------------------------------+
| 15.0                                   |
+----------------------------------------+
```

불리언 배열의 요소의 곱 계산(true=1, false=0):
```sql
SELECT array_product([true, false, true, true]);
+------------------------------------------+
| array_product([true, false, true, true]) |
+------------------------------------------+
|                                        0 |
+------------------------------------------+
```

빈 배열은 NULL을 반환합니다:
```sql
SELECT array_product([]);
+----------------------+
| array_product([])    |
+----------------------+
| NULL                 |
+----------------------+
```

모든 요소가 null인 배열은 NULL을 반환합니다:
```sql
SELECT array_product([null, null, null]);
+----------------------------------+
| array_product([null, null, null]) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

복합 타입 예제:

중첩 배열 타입은 지원되지 않으므로 오류가 발생합니다:
```sql
SELECT array_product([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage: array_product does not support type: ARRAY<ARRAY<TINYINT>>
```

Map 타입은 지원되지 않으므로 오류가 발생합니다:
```sql
SELECT array_product([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage: array_product does not support type: ARRAY<MAP<VARCHAR(1),TINYINT>>
```

매개변수 개수가 잘못된 경우 발생하는 오류:
```sql
SELECT array_product([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not found function 'array_product' which has 2 arity. Candidate functions are: [array_product(Expression)]
```

배열이 아닌 타입을 전달할 때 발생하는 오류:
```sql
SELECT array_product('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not find the compatibility function signature: array_product(VARCHAR(12))
```

### 키워드 {#keywords}

ARRAY, PRODUCT, ARRAY_PRODUCT
