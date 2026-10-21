---
{
    "title": "ARRAY_FILTER",
    "language": "ko",
    "description": "조건에 따라 배열 요소를 필터링하고 조건을 충족하는 요소로 구성된 새 배열을 반환합니다."
}
---

## array_filter {#array_filter}

<version since="2.0.0">

</version>

## 설명 {#description}

조건에 따라 배열 요소를 필터링하고 조건을 충족하는 요소로 구성된 새 배열을 반환합니다. 이 함수는 lambda 표현식을 사용하는 고차 함수 형식과 불리언 배열을 직접 사용하는 필터링 형식의 두 가지 호출 방식을 지원합니다.

## 구문 {#syntax}

```sql
array_filter(lambda, array1, ...)
array_filter(array1, array<boolean> filter_array)
```

### 매개변수 {#parameters}

- `lambda`：배열 요소를 평가하는 데 사용하는 lambda 표현식으로, true/false 또는 불리언 값으로 변환할 수 있는 표현식을 반환합니다
- `array1, ...`：하나 이상의 ARRAY\<T> 타입 매개변수
- `filter_array`：필터링에 사용하는 ARRAY\<BOOLEAN> 타입의 불리언 배열

**지원되는 T 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2, TIMESTAMP_NS
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6
- UUID: [UUID](../../../basic-element/sql-data-types/uuid.md)
- 복합 데이터 타입: ARRAY, MAP, STRUCT

### 반환값 {#return-value}

반환 타입: ARRAY\<T>

반환값의 의미:
- 필터링 조건을 충족하는 모든 요소로 구성된 새 배열을 반환합니다
- NULL: 입력 배열이 NULL인 경우
- 빈 배열: 조건을 충족하는 요소가 없는 경우

사용 시 참고 사항:
- lambda 형식: lambda 표현식의 매개변수 수는 배열 매개변수 수와 일치해야 합니다
- 불리언 배열 형식: `array1`과 `filter_array`의 길이는 완전히 일치하는 것이 좋습니다. 불리언 배열이 더 길면 초과하는 불리언 값은 무시되며, 더 짧으면 불리언 배열의 위치에 대응하는 요소만 처리됩니다
- 여러 배열 및 복합 타입 배열의 필터링을 지원합니다
- 빈 배열은 빈 배열을 반환하고, NULL 배열은 NULL을 반환합니다
- lambda는 모든 스칼라 표현식을 사용할 수 있지만 집계 함수는 사용할 수 없습니다
- lambda 표현식은 다른 고차 함수를 호출할 수 있지만 호환되는 타입을 반환해야 합니다
- 배열 요소에 null 값이 있는 경우: null 요소는 처리를 위해 lambda 표현식에 전달되며, lambda는 null 값을 평가할 수 있습니다

### 예제 {#examples}

```sql
CREATE TABLE array_filter_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    string_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_filter_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['a', 'bb', 'ccc', 'dddd', 'eeeee']),
(2, [10, 20, 30], [10.5, 20.5, 30.5], ['x', 'yy', 'zzz']),
(3, [], [], []),
(4, NULL, NULL, NULL);
```

**쿼리 예제:**

lambda 표현식을 사용하여 double_array에서 3 이상인 요소를 필터링합니다:
```sql
SELECT array_filter(x -> x >= 3, double_array) FROM array_filter_test WHERE id = 1;
+------------------------------------------+
| array_filter(x -> x >= 3, double_array)  |
+------------------------------------------+
| [3.3, 4.4, 5.5]                          |
+------------------------------------------+
```

lambda 표현식을 사용하여 string_array에서 길이가 2보다 큰 요소를 필터링합니다:
```sql
SELECT array_filter(x -> length(x) > 2, string_array) FROM array_filter_test WHERE id = 1;
+--------------------------------------------------+
| array_filter(x -> length(x) > 2, string_array)   |
+--------------------------------------------------+
| ["ccc", "dddd", "eeeee"]                         |
+--------------------------------------------------+
```

불리언 배열을 사용하여 요소를 필터링합니다:
```sql
SELECT array_filter(int_array, [false, true, false, true, true]) FROM array_filter_test WHERE id = 1;
+-----------------------------------------------------------+
| array_filter(int_array, [false, true, false, true, true]) |
+-----------------------------------------------------------+
| [2, 4, 5]                                                 |
+-----------------------------------------------------------+
```

불리언 배열 필터링 예제로, 불리언 값에 따라 해당 위치의 요소를 유지할지 결정합니다:

```sql
SELECT array_filter([1,2,3], [true, false, true]);
+--------------------------------------------+
| array_filter([1,2,3], [true, false, true]) |
+--------------------------------------------+
| [1, 3]                                     |
+--------------------------------------------+
```

불리언 배열의 길이가 원래 배열보다 길면 초과하는 불리언 값은 무시됩니다:
```sql
SELECT array_filter([1,2,3], [true, false, true, false]);
+---------------------------------------------------+
| array_filter([1,2,3], [true, false, true, false]) |
+---------------------------------------------------+
| [1, 3]                                            |
+---------------------------------------------------+
```

불리언 배열의 길이가 원래 배열보다 짧으면 불리언 배열의 위치에 대응하는 요소만 처리됩니다:
```sql
SELECT array_filter([1,2,3], [true, false]);
+--------------------------------------+
| array_filter([1,2,3], [true, false]) |
+--------------------------------------+
| [1]                                  |
+--------------------------------------+
```

빈 배열은 빈 배열을 반환합니다:
```sql
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 3;
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```

NULL 배열은 NULL을 반환합니다. 입력 배열이 NULL이면 오류를 발생시키지 않고 NULL을 반환합니다.
```sql
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 4;
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

null 값이 포함된 배열에서 lambda는 null을 평가할 수 있습니다:
```sql
+------------------------------------------------------------+
| array_filter(x -> x is not null, [null, 1, null, 2, null]) |
+------------------------------------------------------------+
| [1, 2]                                                     |
+------------------------------------------------------------+
```

여러 배열을 사용한 필터링으로, int_array > double_array인 요소를 필터링합니다:
```sql
SELECT array_filter((x, y) -> x > y, int_array, double_array) FROM array_filter_test WHERE id = 1;
+--------------------------------------------------------+
| array_filter((x, y) -> x > y, int_array, double_array) |
+--------------------------------------------------------+
| []                                                     |
+--------------------------------------------------------+
```

복합 타입 예제:

중첩 배열에서 각 하위 배열의 길이가 2보다 큰 요소를 필터링합니다:
```sql
SELECT array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]);
+-------------------------------------------------------------------+
| array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]) |
+-------------------------------------------------------------------+
| [[3, 4, 5], [7, 8, 9, 10]]                                        |
+-------------------------------------------------------------------+
```

Map 타입에서 키 'a'의 값이 10보다 큰 요소를 필터링합니다:
```sql
SELECT array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
+---------------------------------------------------------------+
| array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+---------------------------------------------------------------+
| [{"a":15}, {"a":20}]                                          |
+---------------------------------------------------------------+
```

Struct 타입에서 age가 18보다 큰 요소를 필터링합니다:
```sql
SELECT array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30)));
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30))) |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Eve", "age":30}]                                                                                                                 |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

매개변수 수가 잘못된 경우:
```sql
SELECT array_filter(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

배열의 길이가 일치하지 않으면 오류가 발생합니다:
```sql
SELECT array_filter((x, y) -> x > y, [1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```

배열이 아닌 타입을 전달하면 오류가 발생합니다:
```sql
SELECT array_filter(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```


**중첩 고차 함수 예제:**

**올바른 예제: lambda에서 스칼라를 반환하는 고차 함수 호출**

이 예제에서는 내부 array_count가 스칼라 값(INT64)을 반환하며 array_filter가 이를 처리할 수 있으므로 중첩 호출이 가능합니다.
```sql
SELECT array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]);
+------------------------------------------------------------------------------+
| array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]) |
+------------------------------------------------------------------------------+
| [[4, 5, 6], [7, 8, 9]]                                                       |
+------------------------------------------------------------------------------+
```

**오류 예제: lambda가 배열 타입을 반환하는 경우**

이 예제에서는 내부 array_exists가 ARRAY<BOOLEAN>을 반환하지만 외부 array_filter는 lambda가 스칼라 값을 반환할 것으로 기대하므로 중첩 호출이 불가능합니다
```sql
SELECT array_filter(x -> array_exists(y -> y > 5, x), [[1,2,3],[4,5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_filter(ARRAY<ARRAY<TINYINT>>, ARRAY<ARRAY<BOOLEAN>>)
```

### 키워드 {#keywords}

ARRAY, FILTER, ARRAY_FILTER
