---
{
    "title": "ARRAY_ENUMERATE_UNIQ",
    "language": "ko",
    "description": "배열의 각 요소가 몇 번째로 등장했는지 나타내는 번호를 반환합니다. 이 함수는 배열의 각 요소에 대해 번호를 생성하며,"
}
---

## array_enumerate_uniq {#array_enumerate_uniq}

<version since="2.0.0">

</version>

## 설명 {#description}

배열의 각 요소가 몇 번째로 등장했는지 나타내는 번호를 반환합니다. 이 함수는 배열의 각 요소에 대해 해당 요소가 배열에서 지금까지 몇 번 등장했는지를 나타내는 번호를 생성합니다.

## 구문 {#syntax}

```sql
array_enumerate_uniq(ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```

### 매개변수 {#parameters}

- `arr1, arr2, ...`：ARRAY<T> 타입으로, 고유 번호를 생성할 대상 배열입니다. 하나 이상의 배열 매개변수를 지원합니다.

**T에 지원되는 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2, TIMESTAMP_NS
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6
- UUID: [UUID](../../../basic-element/sql-data-types/uuid.md)

### 반환 값 {#return-value}

반환 타입: ARRAY<BIGINT>

반환 값의 의미:
- 입력 배열과 길이가 같은 새 배열을 반환하며, 각 위치에는 원래 배열의 해당 요소가 몇 번째로 등장했는지를 나타내는 번호가 포함됩니다
- NULL: 입력 배열이 NULL인 경우

사용 시 참고 사항:
- 이 함수는 배열의 각 요소에 대해 1부터 시작하여 증가하는 고유 번호를 생성합니다
- 여러 번 등장하는 요소는 등장할 때마다 번호가 증가합니다
- 배열 매개변수가 여러 개일 때는 모든 배열의 길이가 같아야 하며, 그렇지 않으면 오류가 발생합니다. 여러 배열에서 같은 위치에 있는 요소들을 조합하여 요소 쌍을 만들고, 이 쌍을 기준으로 번호를 생성합니다
- 빈 배열은 빈 배열을 반환하고, NULL 배열은 NULL을 반환합니다
- 배열 요소에 null 값이 있는 경우: null 요소에도 해당 번호가 생성됩니다

**쿼리 예시:**

배열의 각 요소에 대해 고유 번호를 생성합니다. 여러 번 등장하는 요소는 등장할 때마다 번호가 증가합니다:
```sql
SELECT array_enumerate_uniq([1, 2, 1, 3, 2, 1]);
+------------------------------------------+
| array_enumerate_uniq([1, 2, 1, 3, 2, 1]) |
+------------------------------------------+
| [1, 1, 2, 1, 2, 3]                       |
+------------------------------------------+
```

빈 배열은 빈 배열을 반환합니다:
```sql
SELECT array_enumerate_uniq([]);
+----------------------+
| array_enumerate_uniq([]) |
+----------------------+
| []                   |
+----------------------+
```

NULL 배열은 NULL을 반환합니다:
```sql
SELECT array_enumerate_uniq(NULL), array_enumerate_uniq(NULL, NULL);
+----------------------------+----------------------------------+
| array_enumerate_uniq(NULL) | array_enumerate_uniq(NULL, NULL) |
+----------------------------+----------------------------------+
| NULL                       | NULL                             |
+----------------------------+----------------------------------+
```

null 값이 포함된 배열에서는 null 요소에도 번호가 생성됩니다:
```sql
SELECT array_enumerate_uniq([1, null, 1, null, 1]);
+--------------------------------------------+
| array_enumerate_uniq([1, null, 1, null, 1]) |
+--------------------------------------------+
| [1, 1, 2, 2, 3]                            |
+--------------------------------------------+
```

배열 매개변수가 여러 개인 예시로, 여러 배열의 요소 조합을 기준으로 번호를 생성합니다:
```sql
SELECT array_enumerate_uniq([1, 2, 1], [10, 20, 10]);
+----------------------------------------------+
| array_enumerate_uniq([1, 2, 1], [10, 20, 10]) |
+----------------------------------------------+
| [1, 1, 2]                                    |
+----------------------------------------------+
```

배열 길이가 일치하지 않는 경우 발생하는 오류:
```sql
SELECT array_enumerate_uniq([1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lengths of all arrays of function array_enumerate_uniq must be equal.
```

IP 타입 지원 예시:
```sql
SELECT array_enumerate_uniq(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>));
+------------------------------------------------------------------------------------------+
| array_enumerate_uniq(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>)) |
+------------------------------------------------------------------------------------------+
| [1, 1, 2]                                                                                |
+------------------------------------------------------------------------------------------+

mysql> SELECT array_enumerate_uniq(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>));
+------------------------------------------------------------------------------------------+
| array_enumerate_uniq(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>)) |
+------------------------------------------------------------------------------------------+
| [1, 1, 2]                                                                                |
+------------------------------------------------------------------------------------------+
```

복합 타입 예시:

중첩 배열 타입은 지원되지 않으며 오류가 발생합니다:
```sql
SELECT array_enumerate_uniq([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_enumerate_uniq does not support type ARRAY<ARRAY<TINYINT>>, expression is array_enumerate_uniq([[1, 2], [3, 4], [5, 6]])
```

Map 타입은 지원되지 않으며 오류가 발생합니다:
```sql
SELECT array_enumerate_uniq([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_enumerate_uniq does not support type ARRAY<MAP<VARCHAR(1),TINYINT>>, expression is array_enumerate_uniq([map('k', 1), map('k', 2), map('k', 3)])
```

매개변수 개수가 잘못된 경우 발생하는 오류:
```sql
SELECT array_enumerate_uniq();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_enumerate_uniq' which has 0 arity. Candidate functions are: [array_enumerate_uniq(Expression, Expression...)]
```

배열이 아닌 타입을 전달한 경우 발생하는 오류:
```sql
SELECT array_enumerate_uniq('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_enumerate_uniq(VARCHAR(12))
```

### 키워드 {#keywords}

ARRAY, ENUMERATE, UNIQ, ARRAY_ENUMERATE_UNIQ
