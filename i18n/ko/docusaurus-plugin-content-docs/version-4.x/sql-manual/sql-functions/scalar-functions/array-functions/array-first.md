---
{
    "title": "ARRAY_FIRST",
    "language": "ko",
    "description": "배열에서 lambda 표현식의 조건을 만족하는 첫 번째 요소를 반환합니다."
}
---

## array_first {#array_first}

<version since="2.0.0">

</version>

### 설명 {#description}

배열에서 lambda 표현식의 조건을 만족하는 첫 번째 요소를 반환합니다. 이 함수는 배열의 요소에 lambda 표현식을 적용하여 조건을 만족하는 첫 번째 요소를 찾아 반환합니다.

### 구문 {#syntax}

```sql
array_first(lambda, array1, ...)
```

### 매개변수 {#parameters}

- `lambda`：배열 요소를 평가하는 데 사용하는 lambda 표현식으로, true/false 또는 불리언 값으로 변환할 수 있는 표현식을 반환합니다.
- `array1, ...`：하나 이상의 ARRAY<T> 타입 매개변수

**T에 지원되는 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6
- 복합 데이터 타입: ARRAY, MAP, STRUCT

### 반환값 {#return-value}

반환 타입: T

반환값의 의미:
- 배열에서 lambda 표현식의 조건을 만족하는 첫 번째 요소를 반환합니다.
- NULL: 배열이 비어 있거나 조건을 만족하는 요소가 없는 경우

사용 시 참고 사항:
- lambda 표현식의 매개변수 개수는 배열 매개변수의 개수와 일치해야 합니다.
- 모든 입력 배열의 길이가 같아야 합니다.
- 여러 배열과 복합 타입 배열에서의 검색을 지원합니다.
- 빈 배열은 NULL을 반환합니다.
- NULL 입력 매개변수는 지원하지 않습니다.
- lambda 표현식에서는 모든 스칼라 표현식을 사용할 수 있지만, 집계 함수는 사용할 수 없습니다.
- lambda 표현식에서 다른 고차 함수를 호출할 수 있지만, 반환 타입이 호환되어야 합니다.
- 배열 요소에 null 값이 있는 경우: null 요소도 lambda 표현식에 전달되어 처리되며, lambda 표현식에서 null 값인지 확인할 수 있습니다.

**쿼리 예제:**

부동소수점 배열에서 3 이상인 첫 번째 요소 찾기:
```sql
SELECT array_first(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]);
+-----------------------------------------------------+
| array_first(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]) |
+-----------------------------------------------------+
|                                                 3.3 |
+-----------------------------------------------------+
```

문자열 배열에서 길이가 2보다 큰 첫 번째 요소 찾기:
```sql
SELECT array_first(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
+----------------------------------------------------------------------+
| array_first(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']) |
+----------------------------------------------------------------------+
| ccc                                                                  |
+----------------------------------------------------------------------+
```

빈 배열은 NULL을 반환합니다:
```sql
SELECT array_first(x -> x > 0, []);
+-------------------------------------+
| array_first(x -> x > 0, [])        |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

NULL 입력 매개변수는 오류를 발생시킵니다:
```sql
SELECT array_first(x -> x > 2, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is NULL

SELECT array_first(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_first', expression: array_first(NULL), The 1st arg of array_filter must be lambda but is NULL
```

null 값이 포함된 배열에서는 lambda 표현식으로 null 여부를 확인할 수 있습니다:
```sql
SELECT array_first(x -> x is not null, [null, 1, null, 3, null, 5]);
+--------------------------------------------------------------+
| array_first(x -> x is not null, [null, 1, null, 3, null, 5]) |
+--------------------------------------------------------------+
|                                                            1 |
+--------------------------------------------------------------+
```

여러 배열 검색: 첫 번째 배열의 요소가 두 번째 배열의 해당 요소보다 큰 첫 번째 요소 찾기:
```sql
SELECT array_first((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]);
+--------------------------------------------------------------------------+
| array_first((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]) |
+--------------------------------------------------------------------------+
|                                                                     NULL |
+--------------------------------------------------------------------------+
```

복합 타입 예제:

중첩 배열 검색: 길이가 2보다 큰 첫 번째 하위 배열 찾기:
```sql
SELECT array_first(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]);
+---------------------------------------------------------------+
| array_first(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]) |
+---------------------------------------------------------------+
| [3, 4, 5]                                                     |
+---------------------------------------------------------------+
```

Map 타입 검색: 키 'a'에 해당하는 값이 10보다 큰 첫 번째 요소 찾기:
```sql
SELECT array_first(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
+---------------------------------------------------------------+
| array_first(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+---------------------------------------------------------------+
| {"a":15}                                                      |
+---------------------------------------------------------------+
```

lambda 표현식의 매개변수 개수가 배열 매개변수의 개수와 일치하지 않을 때 발생하는 오류:
```sql
SELECT array_first(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

매개변수 개수가 잘못된 경우 발생하는 오류:
```sql
SELECT array_first((x, y) -> x > y, [1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```

배열이 아닌 타입을 전달할 때 발생하는 오류:
```sql
SELECT array_first(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```

### 키워드 {#keywords}

ARRAY, FIRST, ARRAY_FIRST
