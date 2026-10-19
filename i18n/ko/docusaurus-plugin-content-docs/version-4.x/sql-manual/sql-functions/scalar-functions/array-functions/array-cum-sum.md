---
{
    "title": "ARRAY_CUM_SUM",
    "language": "ko",
    "description": "배열의 누적 합을 계산합니다. 이 함수는 배열을 왼쪽에서 오른쪽으로 순회하며,"
}
---

## array_cum_sum {#array_cum_sum}

<version since="2.0.0">

</version>

## 설명 {#description}

배열의 누적 합을 계산합니다. 이 함수는 배열을 왼쪽에서 오른쪽으로 순회하면서 처음부터 현재 위치까지(현재 위치 포함)의 모든 요소를 더하고, 원래 배열과 길이가 같은 새 배열을 반환합니다.

## 구문 {#syntax}

```sql
array_cum_sum(ARRAY<T> arr)
```

### 매개변수 {#parameters}

- `arr`：ARRAY\<T> 타입으로, 누적 합을 계산할 배열입니다. 컬럼 이름이나 상수 값을 사용할 수 있습니다.

**지원되는 T 타입:**
  - 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT，FLOAT, DOUBLE，DECIMAL

### 반환 값 {#return-value}

반환 타입: ARRAY\<T>

반환 값의 의미:

- 입력 배열과 길이가 같은 새 배열을 반환합니다. 각 위치에는 원래 배열의 처음부터 현재 위치까지의 모든 요소의 합이 들어갑니다.
- NULL: 입력 배열이 NULL인 경우

사용 시 참고 사항:
- 배열에 다른 타입(문자열 등)이 포함되어 있으면 요소를 DOUBLE 타입으로 변환하려고 시도합니다. 변환에 실패한 요소는 null이 됩니다.
- 이 함수는 누적 합을 계산하기 위해 모든 요소를 호환되는 숫자 타입으로 변환하려고 시도합니다. 누적 합의 반환 타입은 입력 타입에 따라 자동으로 선택됩니다.
  - 입력이 DOUBLE 또는 FLOAT이면 ARRAY\<DOUBLE>을 반환합니다.
  - 입력이 정수 타입이면 ARRAY\<BIGINT> 또는 ARRAY\<LARGEINT>를 반환합니다.
  - 입력이 DECIMAL이면 원래의 정밀도와 스케일을 유지하는 ARRAY\<DECIMAL>을 반환합니다.
- 누적 합은 왼쪽에서 오른쪽 순서로 계산되며, 각 위치에는 그 앞에 있는 null이 아닌 모든 요소의 합이 들어갑니다.
- 빈 배열은 빈 배열을 반환하고, NULL 배열은 NULL을 반환하며, 요소가 하나뿐인 배열은 원래 배열을 반환합니다.
- 중첩 배열, MAP, STRUCT 및 기타 복합 타입은 누적 합을 지원하지 않으며, 호출하면 오류가 발생합니다.
- 배열 요소에 null 값이 있는 경우: 처음으로 null이 아닌 값이 나온 뒤부터는 누적 값 이후의 null을 0으로 처리하여 누적 합 계산에 사용합니다.

### 예제 {#examples}

```sql
CREATE TABLE array_cum_sum_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_cum_sum_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]),
(2, [10, 20, 30], [10.5, 20.5, 30.5]),
(3, [], []),
(4, NULL, NULL);
```

**쿼리 예제:**

int_array의 누적 합: 각 위치에는 처음부터 현재 위치까지(현재 위치 포함)의 모든 요소의 합이 들어갑니다.
```sql
SELECT array_cum_sum(int_array) FROM array_cum_sum_test WHERE id = 1;
+-----------------------------+
| array_cum_sum(int_array)    |
+-----------------------------+
| [1, 3, 6, 10, 15]           |
+-----------------------------+
```

double_array의 누적 합: 부동 소수점 배열의 누적 합이며, 결과도 부동 소수점 값입니다.

두 번째 위치의 결과가 3.3000000000000003인 것은 부동 소수점의 이진 표현 정밀도로 인해 작은 오차가 발생하기 때문입니다. 1.1과 2.2는 이진 부동 소수점(IEEE 754 배정밀도)으로 정확하게 표현할 수 없으므로 근삿값으로만 저장됩니다. 두 값을 더하면 오차가 누적되어 3.3000000000000003이 됩니다. 이후의 누적 합(예: 6.6, 11, 16.5)은 "정상적인 값"처럼 보일 수 있지만, 실제로는 근삿값이며 반올림한 결과가 십진수 값과 일치할 뿐입니다. 이는 IEEE 754 부동 소수점에 기반한 모든 시스템(MySQL, Snowflake, Python, JavaScript 등)에서 발생하는 현상입니다.
```sql
SELECT array_cum_sum(double_array) FROM array_cum_sum_test WHERE id = 1;
+------------------------------------------+
| array_cum_sum(double_array)              |
+------------------------------------------+
| [1.1, 3.3000000000000003, 6.6, 11, 16.5] |
+------------------------------------------+
```

문자열과 숫자를 함께 사용하면 숫자로 변환할 수 있는 요소는 누적 합 계산에 사용되고, 변환할 수 없는 요소는 null이 됩니다. 이때 null 값은 누적 합 계산에서 0으로 처리됩니다.
```sql
SELECT array_cum_sum(['a', 1, 'b', 2, 'c', 3]);
+-----------------------------------------+
| array_cum_sum(['a', 1, 'b', 2, 'c', 3]) |
+-----------------------------------------+
| [null, 1, null, 3, null, 6]             |
+-----------------------------------------+
```

빈 배열은 빈 배열을 반환합니다.
```sql
SELECT array_cum_sum(int_array) FROM array_cum_sum_test WHERE id = 3;
+-----------------------------+
| array_cum_sum(int_array)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

NULL 배열은 NULL을 반환합니다. 입력 배열이 NULL이면 오류를 발생시키지 않고 NULL을 반환합니다.
```sql
SELECT array_cum_sum(int_array) FROM array_cum_sum_test WHERE id = 4;
+-----------------------------+
| array_cum_sum(int_array)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

요소가 하나뿐인 배열은 원래 배열을 반환합니다.
```sql
SELECT array_cum_sum([42]);
+----------------------+
| array_cum_sum([42])  |
+----------------------+
| [42]                 |
+----------------------+
```

배열에 null 값이 포함된 경우, 처음으로 null이 아닌 값이 나온 뒤부터는 누적 값 이후의 null을 0으로 처리하여 누적 합 계산에 사용합니다.
```sql
SELECT array_cum_sum([null, 1, null, 3, null, 5]);
+--------------------------------------------+
| array_cum_sum([null, 1, null, 3, null, 5]) |
+--------------------------------------------+
| [null, 1, 1, 4, 4, 9]                      |
+--------------------------------------------+
```

복합 타입 예제:

중첩 배열 타입은 지원되지 않으며 오류가 발생합니다.
```sql
SELECT array_cum_sum([[1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(ARRAY<ARRAY<TINYINT>>)
```

Map 타입은 지원되지 않으며 오류가 발생합니다.
```sql
SELECT array_cum_sum([{'k':1},{'k':2}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(ARRAY<MAP<VARCHAR(1),TINYINT>>)
```

Struct 타입은 지원되지 않으며 오류가 발생합니다.
```sql
SELECT array_cum_sum(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30)));
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(ARRAY<STRUCT<name:TEXT,age:TINYINT>>)
```

매개변수 개수가 올바르지 않으면 오류가 발생합니다.
```sql
SELECT array_cum_sum([1,2,3],[4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_cum_sum' which has 2 arity. Candidate functions are: [array_cum_sum(Expression)]
```

배열이 아닌 타입을 전달하면 오류가 발생합니다.
```sql
SELECT array_cum_sum('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(VARCHAR(12))
```

### 키워드 {#keywords}

ARRAY, CUM, SUM, CUM_SUM, ARRAY_CUM_SUM
