---
{
    "title": "ARRAY_DIFFERENCE",
    "language": "ko",
    "description": "배열에서 인접한 요소 간의 차이를 계산합니다. 이 함수는 배열을 왼쪽에서 오른쪽으로 순회하며,"
}
---

## array_difference {#array_difference}

<version since="2.0.0">

</version>

## 설명 {#description}

배열에서 인접한 요소 간의 차이를 계산합니다. 이 함수는 배열을 왼쪽에서 오른쪽으로 순회하면서 각 요소와 이전 요소의 차이를 계산하고, 원본 배열과 길이가 같은 새 배열을 반환합니다. 첫 번째 요소의 차이는 항상 0입니다.

## 구문 {#syntax}

```sql
array_difference(ARRAY<T> arr)
```

### 매개변수 {#parameters}

- `arr`：ARRAY\<T> 타입으로, 차이를 계산할 배열입니다. 컬럼 이름이나 상숫값을 사용할 수 있습니다.

**지원되는 T 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL

### 반환 값 {#return-value}

반환 타입: ARRAY\<T>

반환 값의 의미:
- 입력 배열과 길이가 같은 새 배열을 반환합니다. 각 위치에는 현재 요소와 이전 요소의 차이가 들어가며, 첫 번째 요소의 차이는 0입니다.
- NULL: 입력 배열이 NULL인 경우

사용 시 참고 사항:
- 배열에 다른 타입(예: 문자열 등)이 포함되어 있으면 요소를 DOUBLE 타입으로 변환하려고 시도합니다. 변환에 실패한 요소는 null이 되며 차이 계산에 참여하지 않습니다.
- 이 함수는 차이를 계산하기 위해 모든 요소를 호환되는 숫자 타입으로 변환하려고 시도하며, 차이의 반환 타입은 입력 타입에 따라 자동으로 선택됩니다.
  - 입력이 DOUBLE 또는 FLOAT이면 ARRAY\<DOUBLE>을 반환합니다.
  - 입력이 정수 타입이면 ARRAY\<BIGINT> 또는 ARRAY\<LARGEINT>를 반환합니다.
  - 입력이 DECIMAL이면 원래 정밀도와 스케일을 유지한 ARRAY\<DECIMAL>을 반환합니다.
- 차이는 왼쪽에서 오른쪽 순서로 계산합니다. 각 위치에는 현재 요소와 이전 요소의 차이가 들어가며, 첫 번째 요소는 0입니다.
- 빈 배열은 빈 배열을 반환하고, NULL 배열은 NULL을 반환하며, 요소가 하나뿐인 배열은 [0]을 반환합니다.
- 복합 타입(중첩 배열, MAP, STRUCT)은 차이 계산을 지원하지 않으며, 호출하면 오류가 발생합니다.
- 배열 요소의 null 값: null 요소는 이후 차이 계산에 영향을 줍니다. 이전 요소가 null이면 현재 차이도 null이 됩니다.

### 예제 {#examples}

```sql
CREATE TABLE array_difference_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_difference_test VALUES
(1, [1, 3, 6, 10, 15], [1.1, 3.3, 6.6, 11.0, 16.5]),
(2, [10, 30, 60], [10.5, 41.0, 76.5]),
(3, [], []),
(4, NULL, NULL);
```

**쿼리 예제:**

int_array의 차이: 각 위치에는 현재 요소와 이전 요소의 차이가 들어가며, 첫 번째 요소는 0입니다.
```sql
SELECT array_difference(int_array) FROM array_difference_test WHERE id = 1;
+-----------------------------+
| array_difference(int_array) |
+-----------------------------+
| [0, 2, 3, 4, 5]             |
+-----------------------------+
```

 double_array의 차이: 부동 소수점 배열의 차이를 계산하며, 결과도 부동 소수점입니다.

두 번째 위치의 결과가 2.1999999999999997이라는 점에 유의하세요. 이는 부동 소수점을 이진수로 표현할 때의 정밀도 한계로 인해 발생하는 작은 오차 때문입니다(3.3 - 1.1은 이진수에서 정확히 2.2로 표현할 수 없습니다). 이후 값인 3.3, 4.4, 5.5는 "정상적인 값"처럼 보일 수 있지만, 실제로는 이진 근삿값이며 반올림한 결과가 십진수 값과 일치할 뿐입니다. 이는 IEEE 754 부동 소수점을 사용하는 모든 시스템(MySQL, Snowflake, Python, JavaScript 등 포함)에서 발생하는 현상입니다.
```sql
SELECT array_difference(double_array) FROM array_difference_test WHERE id = 1;
+------------------------------------------+
| array_difference(double_array)           |
+------------------------------------------+
| [0, 2.1999999999999997, 3.3, 4.4, 5.5]  |
+------------------------------------------+
```

빈 배열은 빈 배열을 반환합니다.
```sql
SELECT array_difference(int_array) FROM array_difference_test WHERE id = 3;
+-----------------------------+
| array_difference(int_array) |
+-----------------------------+
| []                          |
+-----------------------------+
```

NULL 배열은 NULL을 반환합니다. 입력 배열이 NULL이면 오류를 발생시키지 않고 NULL을 반환합니다.
```sql
SELECT array_difference(int_array) FROM array_difference_test WHERE id = 4;
+-----------------------------+
| array_difference(int_array) |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

요소가 하나뿐인 배열은 [0]을 반환합니다.
```sql
SELECT array_difference([42]);
+------------------------+
| array_difference([42]) |
+------------------------+
| [0]                    |
+------------------------+
```

null 값이 포함된 배열에서는 이전 요소가 null이면 현재 차이도 null이 됩니다.
```sql
SELECT array_difference([1, null, 3, null, 5]);
+-----------------------------------------+
| array_difference([1, null, 3, null, 5]) |
+-----------------------------------------+
| [0, null, null, null, null]             |
+-----------------------------------------+
```

문자열과 숫자가 섞여 있으면 숫자로 변환할 수 있는 요소는 차이 계산에 참여합니다. 변환할 수 없는 요소는 null이 되며, 해당 위치의 결과도 null이 됩니다.
```sql
SELECT array_difference(['a', 1, 'b', 2, 'c', 3]);
+--------------------------------------------+
| array_difference(['a', 1, 'b', 2, 'c', 3]) |
+--------------------------------------------+
| [null, null, null, null, null, null]       |
+--------------------------------------------+
```

복합 타입 예제:

중첩 배열 타입은 지원되지 않으며 오류가 발생합니다.
```sql
SELECT array_difference([[1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(ARRAY<ARRAY<TINYINT>>)
```

Map 타입은 지원되지 않으며 오류가 발생합니다.
```sql
SELECT array_difference([{'k':1},{'k':2}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(ARRAY<MAP<VARCHAR(1),TINYINT>>)
```

Struct 타입은 지원되지 않으며 오류가 발생합니다.
```sql
SELECT array_difference(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30)));
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(ARRAY<STRUCT<name:TEXT,age:TINYINT>>)
```

매개변수 개수가 잘못되면 오류가 발생합니다.
```sql
SELECT array_difference([1,2,3],[4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_difference' which has 2 arity. Candidate functions are: [array_difference(Expression)]
```

배열이 아닌 타입을 전달하면 오류가 발생합니다.
```sql
SELECT array_difference('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(VARCHAR(12))
```

### 키워드 {#keywords}

ARRAY, DIFFERENCE, ARRAY_DIFFERENCE
