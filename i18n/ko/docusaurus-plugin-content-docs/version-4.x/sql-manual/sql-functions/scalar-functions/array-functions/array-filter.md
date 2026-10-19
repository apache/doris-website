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

- `lambda`：배열 요소를 평가하는 데 사용하는 lambda 표현식으로, true/false 또는 불리언 값으로 변환할 수 있는 표현식을 반환합니다.
- `array1, ...`：하나 이상의 ARRAY\<T> 타입 매개변수
- `filter_array`：ARRAY\<BOOLEAN> 타입으로, 필터링에 사용하는 불리언 배열

**T에 지원되는 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6
- 복합 데이터 타입: ARRAY, MAP, STRUCT

### 반환 값 {#return-value}

반환 타입: ARRAY\<T>

반환 값의 의미:
- 필터링 조건을 충족하는 모든 요소로 구성된 새 배열을 반환합니다.
- NULL: 입력 배열이 NULL인 경우
- 빈 배열: 조건을 충족하는 요소가 없는 경우

사용 시 참고 사항:
- Lambda 형식: lambda 표현식의 매개변수 개수는 배열 매개변수의 개수와 일치해야 합니다.
- 불리언 배열 형식: `array1`과 `filter_array`의 길이는 정확히 일치하는 것이 좋습니다. 불리언 배열이 더 길면 초과하는 불리언 값은 무시됩니다. 불리언 배열이 더 짧으면 불리언 배열의 해당 위치에 대응하는 요소만 처리됩니다.
- 여러 배열과 복합 타입 배열의 필터링을 지원합니다.
- 빈 배열은 빈 배열을 반환하고, NULL 배열은 NULL을 반환합니다.
- Lambda는 모든 스칼라 표현식을 사용할 수 있지만 집계 함수는 사용할 수 없습니다.
- Lambda 표현식에서 다른 고차 함수를 호출할 수 있지만, 호환되는 타입을 반환해야 합니다.
- 배열 요소의 null 값 처리: null 요소는 처리를 위해 lambda 표현식에 전달되며, lambda에서 null 값을 평가할 수 있습니다.

### 예제 {#examples}

**준비**: 테스트용 테이블을 생성하고, 일반적인 경우, 경계 사례, 빈 배열, NULL 시나리오를 다루는 4개 행의 데이터 적재를 수행합니다. 이후 모든 예제는 이 테이블을 참조합니다.

```sql {setup}
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

**예제 1**: DOUBLE 배열 컬럼에 Lambda를 적용하여 `>= 3` 조건을 충족하는 요소를 유지합니다.

```sql {example="1"}
SELECT array_filter(x -> x >= 3, double_array) FROM array_filter_test WHERE id = 1;
```

```result {example="1"}
+------------------------------------------+
| array_filter(x -> x >= 3, double_array)  |
+------------------------------------------+
| [3.3, 4.4, 5.5]                          |
+------------------------------------------+
```

**예제 2**: STRING 배열 컬럼에 Lambda를 적용하여 `length > 2` 조건을 충족하는 요소를 유지합니다.

```sql {example="2"}
SELECT array_filter(x -> length(x) > 2, string_array) FROM array_filter_test WHERE id = 1;
```

```result {example="2"}
+--------------------------------------------------+
| array_filter(x -> length(x) > 2, string_array)   |
+--------------------------------------------------+
| ["ccc", "dddd", "eeeee"]                         |
+--------------------------------------------------+
```

**예제 3**: 불리언 마스크 형식으로, 마스크 값이 `true`인 위치의 요소를 유지합니다.

```sql {example="3"}
SELECT array_filter(int_array, [false, true, false, true, true]) FROM array_filter_test WHERE id = 1;
```

```result {example="3"}
+-----------------------------------------------------------+
| array_filter(int_array, [false, true, false, true, true]) |
+-----------------------------------------------------------+
| [2, 4, 5]                                                 |
+-----------------------------------------------------------+
```

**예제 4**: 배열 리터럴에 불리언 마스크 형식을 적용합니다.

```sql {example="4"}
SELECT array_filter([1,2,3], [true, false, true]);
```

```result {example="4"}
+--------------------------------------------+
| array_filter([1,2,3], [true, false, true]) |
+--------------------------------------------+
| [1, 3]                                     |
+--------------------------------------------+
```

**예제 5**: 불리언 배열이 값 배열보다 길면 초과하는 마스크 항목은 무시됩니다.

```sql {example="5"}
SELECT array_filter([1,2,3], [true, false, true, false]);
```

```result {example="5"}
+---------------------------------------------------+
| array_filter([1,2,3], [true, false, true, false]) |
+---------------------------------------------------+
| [1, 3]                                            |
+---------------------------------------------------+
```

**예제 6**: 불리언 배열이 값 배열보다 짧으면 마스크가 있는 위치의 요소만 처리됩니다.

```sql {example="6"}
SELECT array_filter([1,2,3], [true, false]);
```

```result {example="6"}
+--------------------------------------+
| array_filter([1,2,3], [true, false]) |
+--------------------------------------+
| [1]                                  |
+--------------------------------------+
```

**예제 7**: 입력 배열이 비어 있으면 빈 배열을 반환합니다(`id = 3`인 행).

```sql {example="7"}
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 3;
```

```result {example="7"}
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```

**예제 8**: 입력 배열이 NULL이면 NULL을 반환합니다(`id = 4`인 행).

```sql {example="8"}
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 4;
```

```result {example="8"}
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

**예제 9**: NULL 요소가 포함된 배열에서 lambda가 `IS NOT NULL` 조건을 검사하여 해당 요소를 제거할 수 있습니다.

```sql {example="9"}
SELECT array_filter(x -> x is not null, [null, 1, null, 2, null]);
```

```result {example="9"}
+------------------------------------------------------------+
| array_filter(x -> x is not null, [null, 1, null, 2, null]) |
+------------------------------------------------------------+
| [1, 2]                                                     |
+------------------------------------------------------------+
```

**예제 10**: 테스트용 테이블의 두 배열에 여러 인수를 받는 lambda를 적용합니다.

```sql {example="10"}
SELECT array_filter((x, y) -> x > y, int_array, double_array) FROM array_filter_test WHERE id = 1;
```

```result {example="10"}
+--------------------------------------------------------+
| array_filter((x, y) -> x > y, int_array, double_array) |
+--------------------------------------------------------+
| []                                                     |
+--------------------------------------------------------+
```

**예제 11**: 중첩 배열 리터럴을 필터링하여 `size > 2` 조건을 충족하는 하위 배열을 유지합니다.

```sql {example="11"}
SELECT array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]);
```

```result {example="11"}
+-------------------------------------------------------------------+
| array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]) |
+-------------------------------------------------------------------+
| [[3, 4, 5], [7, 8, 9, 10]]                                        |
+-------------------------------------------------------------------+
```

**예제 12**: MAP 배열을 필터링하여 `x['a'] > 10` 조건을 충족하는 요소를 유지합니다.

```sql {example="12"}
SELECT array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
```

```result {example="12"}
+---------------------------------------------------------------+
| array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+---------------------------------------------------------------+
| [{"a":15}, {"a":20}]                                          |
+---------------------------------------------------------------+
```

**예제 13**: 필드 값을 기준으로 STRUCT 배열을 필터링합니다.

```sql {example="13"}
SELECT array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30)));
```

```result {example="13"}
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30))) |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Eve", "age":30}]                                                                                                                 |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

**예제 14**: Lambda 매개변수의 개수는 전달된 배열의 개수와 일치해야 합니다.

```sql {example="14"}
SELECT array_filter(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
```

```error {example="14"}
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

**예제 15**: 여러 배열을 사용하는 형식에서는 모든 입력 배열의 길이가 같아야 합니다.

```sql {example="15"}
SELECT array_filter((x, y) -> x > y, [1,2,3], [4,5]);
```

```error {example="15"}
ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```

**예제 16**: 첫 번째 인수는 배열이어야 합니다.

```sql {example="16"}
SELECT array_filter(x -> x > 0, 'not_an_array');
```

```error {example="16"}
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```

**예제 17**: 중첩된 고차 함수에서 내부 `array_count`는 외부 `array_filter`의 lambda에서 사용할 수 있는 스칼라 값을 반환합니다.

```sql {example="17"}
SELECT array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]);
```

```result {example="17"}
+------------------------------------------------------------------------------+
| array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]) |
+------------------------------------------------------------------------------+
| [[4, 5, 6], [7, 8, 9]]                                                       |
+------------------------------------------------------------------------------+
```

**예제 18**: 반례로, 외부 `array_filter`의 lambda는 배열을 반환할 수 없습니다(여기서 `array_exists`는 스칼라 값이 아닌 ARRAY<BOOLEAN>을 반환합니다).

```sql {example="18"}
SELECT array_filter(x -> array_exists(y -> y > 5, x), [[1,2,3],[4,5,6]]);
```

```error {example="18"}
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_filter(ARRAY<ARRAY<TINYINT>>, ARRAY<ARRAY<BOOLEAN>>)
```

### 키워드 {#keywords}

ARRAY, FILTER, ARRAY_FILTER
