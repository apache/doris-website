---
{
    "title": "ARRAY_LAST",
    "language": "ko",
    "description": "배열에서 lambda 표현식을 만족하는 마지막 원소를 찾습니다. 조건을 만족하는 마지막 원소를 찾아 반환합니다."
}
---

## array_last {#array_last}

<version since="2.0.0">

</version>

## 설명 {#description}

배열에서 lambda 표현식을 만족하는 마지막 원소를 찾습니다. 조건을 만족하는 마지막 원소를 찾아 반환합니다.

## 구문 {#syntax}

```sql
array_last(lambda, ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```

### 매개변수 {#parameters}

- `lambda`：검색 조건을 정의하는 lambda 표현식
- `arr1, arr2, ...`：검색할 배열로, ARRAY<T> 타입입니다. 하나 이상의 배열 매개변수를 지원합니다.

**T에 지원되는 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6
- 복합 타입: ARRAY, MAP, STRUCT

### 반환값 {#return-value}

반환 타입: T

반환값의 의미:
- 배열에서 lambda 표현식을 만족하는 마지막 원소를 반환합니다
- NULL: 조건을 만족하는 원소가 없거나 입력 배열이 NULL인 경우

사용 시 참고 사항:
- lambda 표현식의 매개변수 개수는 배열 매개변수의 개수와 일치해야 합니다
- 조건을 만족하는 원소가 없으면 NULL을 반환합니다
- NULL 입력 매개변수는 지원하지 않습니다
- 배열 매개변수가 여러 개이면 모든 배열의 길이가 같아야 합니다
- lambda 표현식에서는 모든 스칼라 표현식을 사용할 수 있지만 집계 함수는 사용할 수 없습니다
- lambda 표현식에서 다른 고차 함수를 호출할 수 있지만 반환 타입이 호환되어야 합니다
- 배열 원소의 null 값 처리: null 원소는 처리를 위해 lambda 표현식에 전달되며, lambda 표현식에서 null 여부를 확인할 수 있습니다

**쿼리 예제:**

부동 소수점 배열에서 3 이상인 마지막 원소를 찾습니다:
```sql
SELECT array_last(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]);
+----------------------------------------------------+
| array_last(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]) |
+----------------------------------------------------+
|                                                5.5 |
+----------------------------------------------------+
```

문자열 배열에서 길이가 2보다 큰 마지막 원소를 찾습니다:
```sql
SELECT array_last(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
+---------------------------------------------------------------------+
| array_last(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']) |
+---------------------------------------------------------------------+
| eeeee                                                               |
+---------------------------------------------------------------------+
```

빈 배열은 NULL을 반환합니다:
```sql
SELECT array_last(x -> x > 0, []);
+-------------------------------------+
| array_last(x -> x > 0, [])        |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

입력 매개변수가 NULL이면 오류가 발생합니다:
```sql
SELECT array_last(x -> x > 2, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is NULL

SELECT array_last(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_last', expression: array_last(NULL), The 1st arg of array_filter must be lambda but is NULL
```

null 값이 포함된 배열에서는 lambda 표현식으로 null 여부를 확인할 수 있습니다:
```sql
SELECT array_last(x -> x is not null, [null, 1, null, 3, null, 5]);
+-------------------------------------------------------------+
| array_last(x -> x is not null, [null, 1, null, 3, null, 5]) |
+-------------------------------------------------------------+
|                                                           5 |
+-------------------------------------------------------------+
```

여러 배열을 검색하여 첫 번째 배열의 원소가 두 번째 배열의 원소보다 큰 마지막 원소를 찾습니다:
```sql
SELECT array_last((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]);
+-------------------------------------------------------------------------+
| array_last((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]) |
+-------------------------------------------------------------------------+
|                                                                    NULL |
+-------------------------------------------------------------------------+
```

중첩 배열의 각 하위 배열을 검색하여 길이가 2보다 큰 마지막 원소를 찾습니다:
```sql
SELECT array_last(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]);
+--------------------------------------------------------------+
| array_last(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]) |
+--------------------------------------------------------------+
| [7, 8, 9, 10]                                                |
+--------------------------------------------------------------+
```

매개변수 개수가 올바르지 않으면 오류가 발생합니다:
```sql
SELECT array_last();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_last' which has 0 arity. Candidate functions are: [array_last(Expression, Expression...)]
```

lambda 표현식의 매개변수 개수가 배열 매개변수의 개수와 일치하지 않으면 오류가 발생합니다:
```sql
SELECT array_last(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

배열이 아닌 타입을 전달하면 오류가 발생합니다:
```sql
SELECT array_last(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_last(Expression, VARCHAR(12))
```

### 키워드 {#keywords}

ARRAY, LAST, ARRAY_LAST
