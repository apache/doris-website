---
{
    "title": "ARRAY_MIN",
    "language": "ko",
    "description": "배열의 최솟값을 계산합니다. 이 함수는 배열의 모든 요소를 순회하여 최솟값을 찾아 반환합니다."
}
---

## array_min {#array_min}

<version since="2.0.0">

</version>

## 설명 {#description}

배열의 최솟값을 계산합니다. 이 함수는 배열의 모든 요소를 순회하여 최솟값을 찾아 반환합니다.

## 구문 {#syntax}

```sql
array_min(ARRAY<T> arr)
```

### 매개변수 {#parameters}

- `arr`：ARRAY<T> 타입으로, 최솟값을 계산할 배열입니다.

**T에 지원되는 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2, TIMESTAMP_NS
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6
- UUID: [UUID](../../../basic-element/sql-data-types/uuid.md)

### 반환 값 {#return-value}

반환 타입: T

반환 값의 의미:
- 배열의 최솟값을 반환합니다.
- NULL: 배열이 비어 있거나 모든 요소가 null인 경우

사용 시 참고 사항:
- 배열의 요소를 비교하여 반환할 요소를 결정하며, 같은 데이터 타입의 요소 간 비교를 지원합니다.
- 배열이 NULL이면 타입 변환 오류가 발생합니다.
- 배열 요소에 null 값이 있으면 해당 요소는 비교에서 제외됩니다.

**쿼리 예제:**

부동 소수점 배열의 최솟값 계산:
```sql
SELECT array_min([5.5, 2.2, 8.8, 1.1, 9.9, 3.3]);
+-------------------------------------------+
| array_min([5.5, 2.2, 8.8, 1.1, 9.9, 3.3]) |
+-------------------------------------------+
|                                       1.1 |
+-------------------------------------------+
```

문자열 배열의 최솟값 계산(사전순):
```sql
SELECT array_min(['zebra', 'apple', 'banana', 'cherry']);
+---------------------------------------------------+
| array_min(['zebra', 'apple', 'banana', 'cherry']) |
+---------------------------------------------------+
| apple                                             |
+---------------------------------------------------+
```

null 값이 포함된 배열의 최솟값 계산. null 요소는 비교에서 제외됩니다:
```sql
SELECT array_min([5, null, 2, null, 8, 1]);
+-------------------------------------+
| array_min([5, null, 2, null, 8, 1]) |
+-------------------------------------+
|                                   1 |
+-------------------------------------+
```

빈 배열은 NULL을 반환합니다:
```sql
SELECT array_min([]);
+------------------+
| array_min([])    |
+------------------+
| NULL             |
+------------------+
```

모든 요소가 null인 배열은 NULL을 반환합니다:
```sql
SELECT array_min([null, null, null]);
+----------------------------------+
| array_min([null, null, null])    |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

날짜 배열의 최솟값:
```sql
SELECT array_min(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>));
+--------------------------------------------------------------------------------+
| array_min(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>)) |
+--------------------------------------------------------------------------------+
| 2022-12-31 00:00:00                                                            |
+--------------------------------------------------------------------------------+
```

IP 주소 배열의 최솟값:
```sql
SELECT array_min(CAST(['192.168.1.100', '192.168.1.1', '192.168.1.50'] AS ARRAY<IPV4>));
+----------------------------------------------------------------------------------+
| array_min(CAST(['192.168.1.100', '192.168.1.1', '192.168.1.50'] AS ARRAY<IPV4>)) |
+----------------------------------------------------------------------------------+
| 192.168.1.1                                                                      |
+----------------------------------------------------------------------------------+

SELECT array_min(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::0'] AS ARRAY<IPV6>));
+-------------------------------------------------------------------------------+
| array_min(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::0'] AS ARRAY<IPV6>)) |
+-------------------------------------------------------------------------------+
| 2001:db8::                                                                    |
+-------------------------------------------------------------------------------+
```

복합 타입 예제:

중첩 배열 타입은 지원되지 않으므로 오류가 발생합니다:
```sql
SELECT array_min([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_min does not support complex types: array_min([[1, 2], [3, 4], [5, 6]])
```

Map 타입은 지원되지 않으므로 오류가 발생합니다:
```sql
SELECT array_min([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_min does not support complex types: array_min([map('k', 1), map('k', 2), map('k', 3)])
```

매개변수 개수가 올바르지 않으면 오류가 발생합니다:
```sql
SELECT array_min([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_min' which has 2 arity. Candidate functions are: [array_min(Expression)]
```

배열이 아닌 타입을 전달하면 오류가 발생합니다:
```sql
SELECT array_min('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.VarcharType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.VarcharType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

배열이 NULL이면 타입 변환 오류가 발생합니다:
```sql
mysql> SELECT array_min(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.NullType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.NullType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

### 키워드 {#keywords}

ARRAY, MIN, ARRAY_MIN
