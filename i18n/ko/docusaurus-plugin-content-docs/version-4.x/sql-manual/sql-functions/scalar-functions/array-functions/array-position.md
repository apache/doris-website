---
{
    "title": "ARRAY_POSITION",
    "language": "ko",
    "description": "배열에서 지정한 요소가 처음 나타나는 위치 인덱스(1부터 시작)를 찾습니다."
}
---

## array_position {#array_position}

<version since="2.0.0">

</version>

## 설명 {#description}

배열에서 지정한 요소가 처음 나타나는 위치 인덱스(1부터 시작)를 찾습니다. 이 함수는 배열을 왼쪽에서 오른쪽으로 순회하면서 처음 일치하는 요소를 찾아 해당 위치 인덱스를 반환합니다.

## 구문 {#syntax}

```sql
array_position(ARRAY<T> arr, T element)
```

### 매개변수 {#parameters}

- `arr`：ARRAY<T> 타입, 검색할 배열
- `element`：T 타입, 찾을 요소

**T에 지원되는 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6

### 반환 값 {#return-value}

반환 타입: BIGINT

반환 값의 의미:
- 배열에서 지정한 요소가 처음 나타나는 위치 인덱스를 반환합니다. 반환 값은 1부터 시작하며 0부터 시작하지 않습니다. 찾을 요소가 배열의 첫 번째 요소이면 이 함수는 1을 반환하며 0을 반환하지 않습니다
- 0: 일치하는 요소가 없거나 입력 배열이 NULL인 경우
- NULL: 입력 배열이 NULL인 경우

사용 시 참고 사항:
- 이 함수는 배열을 왼쪽에서 오른쪽으로 순회하면서 처음 일치하는 요소를 찾습니다. 일치하는 요소가 없으면 0을 반환합니다
- 빈 배열은 0을 반환합니다
- 배열 요소가 null인 경우: null 요소도 정상적으로 검색할 수 있습니다

**쿼리 예제:**

배열에서 문자열의 위치 찾기:
```sql
SELECT array_position(['apple', 'banana', 'cherry', 'apple'], 'apple');
+-----------------------------------------------------------------+
| array_position(['apple', 'banana', 'cherry', 'apple'], 'apple') |
+-----------------------------------------------------------------+
|                                                               1 |
+-----------------------------------------------------------------+
```

배열에서 부동 소수점 수의 위치 찾기:
```sql
SELECT array_position([1.1, 2.2, 3.3, 4.4, 5.5], 3.3);
+------------------------------------------------+
| array_position([1.1, 2.2, 3.3, 4.4, 5.5], 3.3) |
+------------------------------------------------+
|                                              3 |
+------------------------------------------------+
```

존재하지 않는 요소 찾기:
```sql
SELECT array_position([1, 2, 3, 4, 5], 10);
+-------------------------------------+
| array_position([1, 2, 3, 4, 5], 10) |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```

null 요소 찾기:
```sql
SELECT array_position([1, null, 3, null, 5], null);
+---------------------------------------------+
| array_position([1, null, 3, null, 5], null) |
+---------------------------------------------+
|                                           2 |
+---------------------------------------------+
```

빈 배열은 0을 반환합니다:
```sql
SELECT array_position([], 1);
+-----------------------+
| array_position([], 1) |
+-----------------------+
|                     0 |
+-----------------------+
```

입력 배열이 NULL이면 NULL을 반환합니다:
```sql
SELECT array_position(NULL, 1);
+-------------------------+
| array_position(NULL, 1) |
+-------------------------+
|                    NULL |
+-------------------------+
```

날짜 타입 검색:
```sql
SELECT array_position(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>), '2023-01-01');
+---------------------------------------------------------------------------------------------------+
| array_position(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>), '2023-01-01') |
+---------------------------------------------------------------------------------------------------+
|                                                                                                 1 |
+---------------------------------------------------------------------------------------------------+
```

IP 주소 검색:
```sql
SELECT array_position(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), '192.168.1.2');
+---------------------------------------------------------------------------------------------------+
| array_position(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), '192.168.1.2') |
+---------------------------------------------------------------------------------------------------+
|                                                                                                 2 |
+---------------------------------------------------------------------------------------------------+

SELECT array_position(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::0'] AS ARRAY<IPV6>), '2001:db8::0');
+---------------------------------------------------------------------------------------------------+
| array_position(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::0'] AS ARRAY<IPV6>), '2001:db8::0') |
+---------------------------------------------------------------------------------------------------+
|                                                                                                 3 |
+---------------------------------------------------------------------------------------------------+
```

복합 타입 예제:

중첩 배열 타입은 지원되지 않으며 오류가 발생합니다:
```sql
SELECT array_position([[1,2], [3,4], [5,6]], [3,4]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_position does not support type ARRAY<ARRAY<TINYINT>>, expression is array_position([[1, 2], [3, 4], [5, 6]])
```

Map 타입 검색:
```sql
SELECT array_position([{'k':1}, {'k':2}, {'k':3}], {'k':2});
ERROR 1105 (HY000): errCode = 2, detailMessage = array_position does not support type ARRAY<MAP<VARCHAR(1),TINYINT>>, expression is array_position([map('k', 1), map('k', 2), map('k', 3)])
```

매개변수 개수가 잘못된 경우 발생하는 오류:
```sql
SELECT array_position([1,2,3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_position' which has 1 arity. Candidate functions are: [array_position(Expression, Expression)]
```

배열이 아닌 타입을 전달할 때 발생하는 오류:
```sql
SELECT array_position('not_an_array', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_position(VARCHAR(12), TINYINT)
```

### 키워드 {#keywords}

ARRAY, POSITION, ARRAY_POSITION
