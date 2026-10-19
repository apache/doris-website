---
{
    "title": "ARRAY_EXCEPT",
    "language": "ko",
    "description": "첫 번째 배열에 존재하지만 두 번째 배열에는 없는 요소를 반환합니다."
}
---

## array_except {#array_except}

<version since="2.0.0">

</version>

## 설명 {#description}

첫 번째 배열에 존재하지만 두 번째 배열에는 없는 요소를 반환합니다. 중복을 제거하고 원래 순서를 유지하여 새 배열을 생성합니다.

## 구문 {#syntax}

```sql
array_except(ARRAY<T> arr1, ARRAY<T> arr2)
```

### 매개변수 {#parameters}

- `arr1`：ARRAY<T> 타입의 첫 번째 배열입니다.
- `arr2`：ARRAY<T> 타입의 두 번째 배열입니다.

**T에 지원되는 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6

### 반환 값 {#return-value}

반환 타입: ARRAY<T>

반환 값의 의미:
- arr1에 존재하지만 arr2에는 없는 고유한 요소를 모두 포함하는 새 배열을 반환하며, arr1의 순서를 유지합니다.
- NULL: 입력 배열 중 하나라도 NULL이면 반환합니다.

사용 시 참고 사항:
- 기본 타입의 배열만 지원하며, 복합 타입(ARRAY, MAP, STRUCT)은 지원하지 않습니다.
- 빈 배열과 임의의 배열을 연산하면 빈 배열을 반환합니다.
- 요소 비교는 타입 호환성 규칙을 따릅니다. 타입이 호환되지 않으면 변환을 시도하며, 변환에 실패하면 null을 반환합니다.
- 배열 요소의 null 값 처리: 연산 시 null 요소를 일반 요소로 취급하며, null과 null은 같은 값으로 간주합니다.

### 예제 {#examples}

```sql
CREATE TABLE array_except_test (
    id INT,
    arr1 ARRAY<INT>,
    arr2 ARRAY<INT>,
    str_arr1 ARRAY<STRING>,
    str_arr2 ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_except_test VALUES
(1, [1, 2, 3, 4, 5], [2, 4]),
(2, [10, 20, 30], [30, 40]),
(3, [], [1, 2]),
(4, NULL, [1, 2]),
(5, [1, null, 2, null, 3], [null, 2]),
(6, [1, 2, 3], NULL),
(7, [1, 2, 3], []),
(8, [], []),
(9, [1, 2, 2, 3, 3, 3, 4, 5, 5], [2, 3, 5]),
(10, [1], [1]);
```

**쿼리 예제:**

기본 정수 배열의 차집합:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 1;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 3, 5]                   |
+-----------------------------+
```

일부 요소가 겹치는 경우:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 2;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [10, 20]                    |
+-----------------------------+
```

빈 배열과 임의의 배열을 연산하는 경우:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 3;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

NULL 배열: 입력 배열 중 하나라도 NULL이면 오류를 발생시키지 않고 NULL을 반환합니다.
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 4;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

null 값을 포함하는 배열:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 5;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 3]                      |
+-----------------------------+
```

두 번째 배열이 NULL인 경우: 입력 배열 중 하나라도 NULL이면 오류를 발생시키지 않고 NULL을 반환합니다.
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 6;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

두 번째 배열이 비어 있는 경우:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 7;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 2, 3]                   |
+-----------------------------+
```

두 배열이 모두 비어 있는 경우:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 8;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

중복 제거 예제:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 9;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 4]                      |
+-----------------------------+
```

모든 요소가 제외되는 경우:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 10;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

문자열 배열의 차집합:
```sql
SELECT array_except(['a', 'b', 'c', 'd'], ['b', 'd']);
+----------------------------------+
| array_except(['a','b','c','d'],['b','d']) |
+----------------------------------+
| ["a", "c"]                      |
+----------------------------------+
```

### 예외 예제 {#exception-examples}

매개변수 개수가 잘못된 경우:
```sql
SELECT array_except([1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_except' which has 1 arity. Candidate functions are: [array_except(Expression, Expression)]
```

타입이 호환되지 않는 경우:
```sql
SELECT array_except([1, 2, 3], ['a', 'b']);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(ARRAY<INT>, ARRAY<VARCHAR(1)>)
```

배열이 아닌 타입을 전달하는 경우:
```sql
SELECT array_except('not_an_array', [1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(VARCHAR(12), ARRAY<INT>)
```

지원하지 않는 복합 타입을 사용하는 경우:
```sql
SELECT array_except([[1,2],[3,4]], [[3,4]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(ARRAY<ARRAY<INT>>, ARRAY<ARRAY<INT>>)
```

### 키워드 {#keywords}

ARRAY, EXCEPT, ARRAY_EXCEPT
