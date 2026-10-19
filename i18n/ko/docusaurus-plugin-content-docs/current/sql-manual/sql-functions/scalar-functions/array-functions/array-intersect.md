---
{
    "title": "ARRAY_INTERSECT",
    "language": "ko",
    "description": "여러 배열의 교집합, 즉 모든 배열에 공통으로 존재하는 요소를 반환합니다."
}
---

## array_intersect {#array_intersect}

<version since="2.0.0">

</version>

### 설명 {#description}

여러 배열의 교집합, 즉 모든 배열에 공통으로 존재하는 요소를 반환합니다. 모든 입력 배열에 존재하는 요소를 찾아 중복을 제거한 새 배열을 만듭니다.

### 구문 {#syntax}

```sql
array_intersect(ARRAY<T> arr1, ARRAY<T> arr2, [ARRAY<T> arr3, ...])
```

### 매개변수 {#parameters}

- `arr1, arr2, arr3, ...`: ARRAY<T> 타입으로, 교집합을 구할 배열입니다. 두 개 이상의 배열 매개변수를 지원합니다.

**지원하는 T의 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2, TIMESTAMP_NS
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6
- UUID: [UUID](../../../basic-element/sql-data-types/uuid.md)

### 반환 값 {#return-value}

반환 타입: ARRAY<T>

반환 값의 의미:
- 모든 입력 배열에 공통으로 존재하는 요소를 중복 없이 포함하는 새 배열을 반환합니다
- 빈 배열: 입력된 모든 배열에 공통으로 존재하는 요소가 없는 경우

사용 시 참고 사항:
- 모든 입력 배열에 공통으로 존재하는 요소를 찾으며, 결과 배열의 요소는 중복이 제거됩니다
- 빈 배열과 NULL이 아닌 배열의 교집합은 빈 배열입니다. 공통 요소가 없으면 빈 배열을 반환합니다.
- NULL 배열은 지원하지 않습니다
- 요소 비교에는 타입 호환성 규칙이 적용됩니다. 타입이 호환되지 않으면 변환을 시도하며, 변환에 실패하면 null이 됩니다
- 배열 요소에 null 값이 있는 경우: null 요소는 연산에서 일반 요소로 취급되며, null은 null과 같은 것으로 간주됩니다

**쿼리 예제:**

두 배열의 교집합:
```sql
SELECT array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8]);
+------------------------------------------------+
| array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8]) |
+------------------------------------------------+
| [4, 2]                                         |
+------------------------------------------------+
```

여러 배열의 교집합:
```sql
SELECT array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8], [2, 4, 10, 12]);
+----------------------------------------------------------------+
| array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8], [2, 4, 10, 12]) |
+----------------------------------------------------------------+
| [2, 4]                                                         |
+----------------------------------------------------------------+
```

문자열 배열의 교집합:
```sql
SELECT array_intersect(['a', 'b', 'c'], ['b', 'c', 'd']);
+--------------------------------------------+
| array_intersect(['a','b','c'], ['b','c','d']) |
+--------------------------------------------+
| ["b", "c"]                                 |
+--------------------------------------------+
```

null 값이 포함된 배열에서는 null을 동등 비교가 가능한 값으로 취급합니다:
```sql
SELECT array_intersect([1, null, 2, null, 3], [null, 2, 3, 4]);
+---------------------------------------------------------+
| array_intersect([1, null, 2, null, 3], [null, 2, 3, 4]) |
+---------------------------------------------------------+
| [null, 2, 3]                                            |
+---------------------------------------------------------+
```

문자열 배열과 정수 배열의 교집합:
문자열 '2'는 정수 2로 변환할 수 있으며, 'b'는 변환에 실패하여 null이 됩니다:
```sql
SELECT array_intersect([1, 2, null, 3], ['2', 'b']);
+----------------------------------------------+
| array_intersect([1, 2, null, 3], ['2', 'b']) |
+----------------------------------------------+
| [null, 2]                                    |
+----------------------------------------------+
```

빈 배열과 임의의 배열의 교집합:
```sql
SELECT array_intersect([], [1, 2, 3]);
+-----------------------------+
| array_intersect([], [1,2,3]) |
+-----------------------------+
| []                          |
+-----------------------------+
```

입력 배열이 NULL이면 오류가 발생합니다:
```sql
SELECT array_intersect(NULL, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.NullType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.NullType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

복합 타입은 지원하지 않으므로 오류가 발생합니다:
중첩 배열 타입은 지원하지 않으므로 오류가 발생합니다:
```sql
SELECT array_intersect([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_intersect does not support type ARRAY<ARRAY<TINYINT>>, expression is array_intersect([[1, 2], [3, 4], [5, 6]])
```

Map 타입은 지원하지 않으므로 오류가 발생합니다:
```sql
SELECT array_intersect([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_intersect does not support type ARRAY<MAP<VARCHAR(1),TINYINT>>, expression is array_intersect([map('k', 1), map('k', 2), map('k', 3)])
```

매개변수 개수가 올바르지 않으면 오류가 발생합니다:
```sql
SELECT array_intersect([1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_intersect' which has 1 arity. Candidate functions are: [array_intersect(Expression, Expression, ...)]
```

배열이 아닌 타입을 전달하면 오류가 발생합니다:
```sql
SELECT array_intersect('not_an_array', [1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_intersect(VARCHAR(12), ARRAY<INT>)
```

### 키워드 {#keywords}

ARRAY, INTERSECT, ARRAY_INTERSECT
