---
{
    "title": "ARRAY_MAP",
    "language": "ko",
    "description": "배열의 요소에 lambda 표현식을 적용하고 새 배열을 반환합니다."
}
---

## array_map {#array_map}

<version since="2.0.0">

</version>

## 설명 {#description}

배열의 요소에 lambda 표현식을 적용하고 새 배열을 반환합니다. 이 함수는 배열의 각 요소에 lambda 표현식을 적용하고 해당 결과를 반환합니다.

## 구문 {#syntax}

```sql
array_map(lambda, ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```

### 매개변수 {#parameters}

- `lambda`：변환 규칙을 정의하는 lambda 표현식
- `arr1, arr2, ...`：변환할 ARRAY<T> 타입의 배열입니다. 하나 이상의 배열 매개변수를 지원합니다.

**T에 지원되는 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2, TIMESTAMP_NS
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6
- UUID: [UUID](../../../basic-element/sql-data-types/uuid.md)
- 복합 타입: ARRAY, MAP, STRUCT

### 반환값 {#return-value}

반환 타입: ARRAY<R>

반환값의 의미:
- 입력 배열과 길이가 같은 새 배열을 반환하며, 각 위치에는 해당 요소에 lambda 표현식을 적용한 결과가 들어 있습니다.

사용 시 참고 사항:
- lambda 표현식의 매개변수 개수는 배열 매개변수의 개수와 일치해야 합니다.
- 입력 배열 매개변수로 NULL을 사용할 수 없습니다.
- 배열 매개변수가 여러 개인 경우 모든 배열의 길이가 같아야 합니다.
- lambda에서는 모든 스칼라 표현식을 사용할 수 있지만 집계 함수는 사용할 수 없습니다.
- lambda 표현식에서 다른 고차 함수를 호출할 수 있지만 반환 타입이 호환되어야 합니다.
- 배열 요소의 null 값 처리: null 요소는 처리를 위해 lambda 표현식에 전달되며, lambda에서 null 값 여부를 확인할 수 있습니다.

**쿼리 예제:**

배열의 각 요소를 제곱합니다:
```sql
SELECT array_map(x -> x * x, [1, 2, 3, 4, 5]);
+------------------------------------------+
| array_map(x -> x * x, [1, 2, 3, 4, 5]) |
+------------------------------------------+
| [1, 4, 9, 16, 25]                       |
+------------------------------------------+
```

부동소수점 배열의 각 요소를 반올림합니다:
```sql
SELECT array_map(x -> round(x), [1.1, 2.7, 3.3, 4.9, 5.5]);
+--------------------------------------------------+
| array_map(x -> round(x), [1.1, 2.7, 3.3, 4.9, 5.5]) |
+--------------------------------------------------+
| [1, 3, 3, 5, 6]                                 |
+--------------------------------------------------+
```

문자열 배열의 각 요소 길이를 계산합니다:
```sql
SELECT array_map(x -> length(x), ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
+--------------------------------------------------+
| array_map(x -> length(x), ['a', 'bb', 'ccc', 'dddd', 'eeeee']) |
+--------------------------------------------------+
| [1, 2, 3, 4, 5]                                 |
+--------------------------------------------------+
```

null 값이 포함된 배열을 처리합니다:
```sql
SELECT array_map(x -> x is not null, [1, null, 3, null, 5]);
+--------------------------------------------------+
| array_map(x -> x is not null, [1, null, 3, null, 5]) |
+--------------------------------------------------+
| [1, 0, 1, 0, 1]                                 |
+--------------------------------------------------+
```

array_map에 NULL을 전달하면 오류가 발생합니다:
```
mysql> SELECT array_map(x->x>2, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is NULL
```

여러 배열 매개변수를 사용하는 예제로, 두 배열에서 같은 위치의 요소를 더합니다:
```sql
SELECT array_map((x, y) -> x + y, [1, 2, 3, 4, 5], [10, 20, 30, 40, 50]);
+--------------------------------------------------+
| array_map((x, y) -> x + y, [1, 2, 3, 4, 5], [10, 20, 30, 40, 50]) |
+--------------------------------------------------+
| [11, 22, 33, 44, 55]                             |
+--------------------------------------------------+
```

중첩 배열을 처리하여 각 하위 배열의 길이를 계산합니다:
```sql
SELECT array_map(x -> size(x), [[1,2],[3,4,5],[6],[7,8,9,10]]);
+--------------------------------------------------+
| array_map(x -> size(x), [[1,2],[3,4,5],[6],[7,8,9,10]]) |
+--------------------------------------------------+
| [2, 3, 1, 4]                                     |
+--------------------------------------------------+
```

Map 타입을 처리하여 각 Map에서 키가 'a'인 값을 추출합니다:
```sql
SELECT array_map(x -> x['a'], [{'a':1,'b':2}, {'a':3,'b':4}, {'a':5,'b':6}]);
+--------------------------------------------------+
| array_map(x -> x['a'], [{'a':1,'b':2}, {'a':3,'b':4}, {'a':5,'b':6}]) |
+--------------------------------------------------+
| [1, 3, 5]                                        |
+--------------------------------------------------+
```

매개변수 개수가 잘못된 경우 발생하는 오류:
```sql
SELECT array_map();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_map' which has 0 arity. Candidate functions are: [array_map(Expression, Expression...)]
```

lambda 표현식의 매개변수 개수가 배열 매개변수의 개수와 일치하지 않는 경우 발생하는 오류:
```sql
SELECT array_map(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

배열이 아닌 타입을 전달한 경우 발생하는 오류:
```sql
SELECT array_map(x -> x * 2, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_map(Expression, VARCHAR(12))
```

### 키워드 {#keywords}

ARRAY, MAP, ARRAY_MAP
