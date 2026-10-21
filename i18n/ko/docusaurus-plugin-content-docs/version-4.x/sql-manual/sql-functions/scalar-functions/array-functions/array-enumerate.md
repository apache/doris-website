---
{
    "title": "ARRAY_ENUMERATE",
    "language": "ko",
    "description": "배열의 각 요소에 대해 위치 인덱스(1부터 시작)를 반환합니다."
}
---

## array_enumerate {#array_enumerate}

<version since="2.0.0">

</version>

## 설명 {#description}

배열의 각 요소에 대해 위치 인덱스(1부터 시작)를 반환합니다. 이 함수는 배열의 각 요소에 대응하는 위치 번호를 생성합니다.

## 구문 {#syntax}

```sql
array_enumerate(ARRAY<T> arr)
```

### 매개변수 {#parameters}

- `arr`：ARRAY<T> 타입으로, 위치 인덱스를 생성할 배열입니다. 컬럼 이름이나 상수 값을 사용할 수 있습니다.

**T에 지원되는 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6
- 복합 타입: ARRAY, MAP, STRUCT

### 반환 값 {#return-value}

반환 타입: ARRAY<BIGINT>

반환 값의 의미:
- 입력 배열과 길이가 같은 새 배열을 반환하며, 각 위치에는 원래 배열의 해당 요소에 대한 위치 인덱스(1부터 시작)가 포함됩니다
- NULL: 입력 배열이 NULL인 경우

사용 시 참고 사항:
- 이 함수는 배열의 각 요소에 대해 1부터 순차적으로 증가하는 위치 인덱스를 생성합니다
- 빈 배열을 입력하면 빈 배열을 반환하고, NULL 배열을 입력하면 NULL을 반환합니다
- 배열 요소의 null 값: null 요소에도 해당 위치 인덱스가 생성됩니다

### 예제 {#examples}

**쿼리 예제:**

배열의 위치 인덱스 생성:
```sql
SELECT array_enumerate([1, 2, 1, 4, 5]);
+----------------------------------+
| array_enumerate([1, 2, 1, 4, 5]) |
+----------------------------------+
| [1, 2, 3, 4, 5]                  |
+----------------------------------+
```

빈 배열을 입력하면 빈 배열 반환:
```sql
SELECT array_enumerate([]);
+----------------------+
| array_enumerate([])  |
+----------------------+
| []                   |
+----------------------+
```

null 값이 포함된 배열에서도 null 요소에 위치 인덱스 생성:
```sql
SELECT array_enumerate([1, null, 3, null, 5]);
+--------------------------------------------+
| array_enumerate([1, null, 3, null, 5])     |
+--------------------------------------------+
| [1, 2, 3, 4, 5]                            |
+--------------------------------------------+
```

복합 타입 예제:

중첩 배열 타입:
```sql
SELECT array_enumerate([[1,2],[3,4],[5,6]]);
+----------------------------------------+
| array_enumerate([[1,2],[3,4],[5,6]])   |
+----------------------------------------+
| [1, 2, 3]                              |
+----------------------------------------+
```

Map 타입:
```sql
SELECT array_enumerate([{'k':1},{'k':2},{'k':3}]);
+----------------------------------------------+
| array_enumerate([{'k':1},{'k':2},{'k':3}])   |
+----------------------------------------------+
| [1, 2, 3]                                    |
+----------------------------------------------+
```

Struct 타입:
```sql
SELECT array_enumerate(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30)));
+----------------------------------------------------------------------------------------+
| array_enumerate(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30))) |
+----------------------------------------------------------------------------------------+
| [1, 2]                                                                                  |
+----------------------------------------------------------------------------------------+
```

매개변수 개수가 잘못된 경우 발생하는 오류:
```sql
SELECT array_enumerate([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_enumerate' which has 2 arity. Candidate functions are: [array_enumerate(Expression)]
```

배열이 아닌 타입을 전달한 경우 발생하는 오류:
```sql
SELECT array_enumerate('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_enumerate(VARCHAR(12))
```

### 키워드 {#keywords}

ARRAY, ENUMERATE, ARRAY_ENUMERATE
