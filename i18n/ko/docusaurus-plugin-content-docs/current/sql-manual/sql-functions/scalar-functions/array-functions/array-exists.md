---
{
    "title": "ARRAY_EXISTS",
    "language": "ko",
    "description": "배열의 요소에 lambda 표현식을 적용하고 각 요소가 조건을 만족하는지 나타내는 불리언 배열을 반환합니다."
}
---

## array_exists {#array_exists}

<version since="2.0.0">

</version>

## 설명 {#description}

배열의 요소에 lambda 표현식을 적용하고 각 요소가 조건을 만족하는지 나타내는 불리언 배열을 반환합니다. 이 함수는 배열의 각 요소에 lambda 표현식을 적용하고 해당 불리언 값을 반환합니다.

## 구문 {#syntax}

```sql
array_exists(lambda, array1, ...)
```

### 매개변수 {#parameters}

- `lambda`：배열 요소를 평가하는 데 사용하는 lambda 표현식으로, true/false 또는 불리언 값으로 변환할 수 있는 표현식을 반환합니다
- `array1, ...`：하나 이상의 ARRAY<T> 타입 매개변수

**T에 지원되는 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2, TIMESTAMP_NS
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6
- UUID: [UUID](../../../basic-element/sql-data-types/uuid.md)
- 복합 데이터 타입: ARRAY, MAP, STRUCT

### 반환 값 {#return-value}

반환 타입: ARRAY<BOOLEAN>

반환 값의 의미:
- 입력 배열과 길이가 같은 불리언 배열을 반환하며, 각 위치에는 대응하는 요소에 lambda 표현식을 적용한 결과가 포함됩니다
- NULL: lambda 표현식 없이 배열 매개변수만 전달되며 그 값이 NULL인 경우

사용 시 참고 사항:
- lambda 표현식의 매개변수 개수는 배열 매개변수 개수와 일치해야 합니다
- 모든 입력 배열의 길이가 같아야 합니다
- 여러 배열 및 복합 타입 배열에 대한 평가를 지원합니다
- 빈 배열은 빈 배열을 반환합니다. lambda 표현식 없이 배열 매개변수만 전달되며 그 값이 NULL인 경우 NULL을 반환합니다. lambda 표현식이 있고 배열이 NULL이면 오류가 발생합니다
- lambda에는 모든 스칼라 표현식을 사용할 수 있지만, 집계 함수는 사용할 수 없습니다
- lambda 표현식에서 다른 고차 함수를 호출할 수 있지만, 반환 타입이 호환되어야 합니다
- 배열 요소의 null 값 처리: null 요소는 처리를 위해 lambda 표현식에 전달되며, lambda에서 null 여부를 확인할 수 있습니다

**쿼리 예제:**

부동 소수점 배열의 각 요소가 3 이상인지 확인합니다:
```sql
SELECT array_exists(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]);
+--------------------------------------------------+
| array_exists(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]) |
+--------------------------------------------------+
| [0, 0, 1, 1, 1]                                 |
+--------------------------------------------------+
```

문자열 배열의 각 요소 길이가 2보다 큰지 확인합니다:
```sql
SELECT array_exists(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
+--------------------------------------------------+
| array_exists(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']) |
+--------------------------------------------------+
| [0, 0, 1, 1, 1]                                 |
+--------------------------------------------------+
```

빈 배열은 빈 배열을 반환합니다:
```sql
SELECT array_exists(x -> x > 0, []);
+-------------------------------------+
| array_exists(x -> x > 0, [])       |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```

NULL 배열과 lambda 표현식의 조합입니다. lambda 표현식과 함께 NULL을 전달하면 오류가 발생합니다. lambda 표현식이 없으면 NULL을 반환합니다:
```sql
SELECT array_exists(NULL);
+--------------------+
| array_exists(NULL) |
+--------------------+
| NULL               |
+--------------------+

SELECT array_exists(x -> x > 2, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is NULL
```

null 값이 포함된 배열에서는 lambda로 null 여부를 확인할 수 있습니다:
null과의 비교 연산(예: >, <, =, >=, <=)은 특수한 IS NULL 또는 IS NOT NULL을 제외하면 모두 null을 반환합니다. 알 수 없는 값(NULL)이 2보다 큰지 판단할 수 없기 때문입니다. 이 동작은 MYSQL, POSTGRESSQL 등과 동일합니다.
```sql
SELECT array_exists(x -> x is not null, [1, null, 3, null, 5]);
+------------------------------------------+
| array_exists(x -> x is not null, [1, null, 3, null, 5]) |
+------------------------------------------+
| [1, 0, 1, 0, 1]                          |
+------------------------------------------+

SELECT array_exists(x -> x > 2, [1, null, 3, null, 5]);
+-------------------------------------------------+
| array_exists(x -> x > 2, [1, null, 3, null, 5]) |
+-------------------------------------------------+
| [0, null, 1, null, 1]                           |
+-------------------------------------------------+
```

여러 배열을 평가하여 첫 번째 배열의 요소가 두 번째 배열의 대응 요소보다 큰지 확인합니다:
```sql
SELECT array_exists((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]);
+--------------------------------------------------------+
| array_exists((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]) |
+--------------------------------------------------------+
| [0, 0, 0, 0, 0]                                       |
+--------------------------------------------------------+
```

복합 타입 예제:

중첩 배열을 평가하여 각 하위 배열의 길이가 2보다 큰지 확인합니다:
```sql
SELECT array_exists(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]);
+----------------------------------------------------------------+
| array_exists(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]) |
+----------------------------------------------------------------+
| [0, 1, 0, 1]                                                   |
+----------------------------------------------------------------+
```

Map 타입을 평가하여 키 'a'에 해당하는 값이 10보다 큰지 확인합니다:
```sql
SELECT array_exists(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
+---------------------------------------------------------------+
| array_exists(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+---------------------------------------------------------------+
| [0, 1, 1]                                                     |
+---------------------------------------------------------------+
```

lambda 표현식의 매개변수 개수가 배열 매개변수 개수와 일치하지 않으면 오류가 발생합니다:
```sql
SELECT array_exists(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

배열의 길이가 서로 다르면 오류가 발생합니다:
```sql
SELECT array_exists((x, y) -> x > y, [1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```

배열이 아닌 타입을 전달하면 오류가 발생합니다:
```sql
SELECT array_exists(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```

### 키워드 {#keywords}

ARRAY, EXISTS, ARRAY_EXISTS
