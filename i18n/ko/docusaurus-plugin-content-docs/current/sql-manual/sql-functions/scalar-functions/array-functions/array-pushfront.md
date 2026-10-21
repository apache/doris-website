---
{
    "title": "ARRAY_PUSHFRONT",
    "language": "ko",
    "description": "배열의 맨 앞에 요소를 추가합니다. 이 함수는 새로 추가한 요소와 원래 배열의 모든 요소를 포함하는 새 배열을 반환합니다. "
}
---

## array_pushfront {#array_pushfront}

<version since="2.0.0">

</version>

## 설명 {#description}

배열의 맨 앞에 요소를 추가합니다. 이 함수는 새로 추가한 요소와 원래 배열의 모든 요소를 포함하는 새 배열을 반환합니다.

## 구문 {#syntax}

```sql
array_pushfront(ARRAY<T> arr, T element)
```

### 매개변수 {#parameters}

- `arr`：ARRAY<T> 타입, 요소를 추가할 배열
- `element`：T 타입, 배열의 맨 앞에 추가할 요소

**T에 지원되는 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2, TIMESTAMP_NS
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6
- UUID: [UUID](../../../basic-element/sql-data-types/uuid.md)
- 복합 타입: ARRAY, MAP, STRUCT

### 반환 값 {#return-value}

반환 타입: ARRAY<T>

반환 값의 의미:
- 새로 추가한 요소와 원래 배열의 모든 요소를 포함하는 새 배열을 반환합니다
- NULL: 입력 배열이 NULL인 경우

사용 시 참고 사항:
- 이 함수는 지정한 요소를 배열의 맨 앞에 추가합니다
- 빈 배열에도 정상적으로 요소를 추가할 수 있으며, 새 요소의 타입은 배열 요소의 타입과 호환되어야 합니다
- 배열 요소에 포함된 null 값: null 요소도 정상적으로 처리됩니다

**쿼리 예제:**

문자열 배열의 맨 앞에 요소 추가:
```sql
SELECT array_pushfront(['banana', 'cherry', 'date'], 'apple');
+--------------------------------------------------------+
| array_pushfront(['banana', 'cherry', 'date'], 'apple') |
+--------------------------------------------------------+
| ["apple", "banana", "cherry", "date"]                  |
+--------------------------------------------------------+
```

null 값이 포함된 배열의 맨 앞에 null 요소 추가:
```sql
SELECT array_pushfront([1, null, 3], null);
+-------------------------------------+
| array_pushfront([1, null, 3], null) |
+-------------------------------------+
| [null, 1, null, 3]                  |
+-------------------------------------+
```

빈 배열의 맨 앞에 요소 추가:
```sql
SELECT array_pushfront([], 42);
+--------------------------+
| array_pushfront([], 42)  |
+--------------------------+
| [42]                     |
+--------------------------+
```

NULL 배열은 NULL을 반환합니다:
```sql
SELECT array_pushfront(NULL, 1);
+---------------------------+
| array_pushfront(NULL, 1)  |
+---------------------------+
| NULL                      |
+---------------------------+
```

부동소수점 배열의 맨 앞에 요소 추가:
```sql
SELECT array_pushfront([2.2, 3.3, 4.4], 1.1);
+------------------------------------------+
| array_pushfront([2.2, 3.3, 4.4], 1.1)   |
+------------------------------------------+
| [1.1, 2.2, 3.3, 4.4]                    |
+------------------------------------------+
```

IP 주소 배열의 맨 앞에 요소 추가:
```sql
SELECT array_pushfront(CAST(['192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), CAST('192.168.1.1' AS IPV4));
+----------------------------------------------------------------------------------+
| array_pushfront(CAST(['192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), CAST('192.168.1.1' AS IPV4)) |
+----------------------------------------------------------------------------------+
| ["192.168.1.1", "192.168.1.2", "192.168.1.3"]                                   |
+----------------------------------------------------------------------------------+
```

중첩 배열의 맨 앞에 요소 추가:
```sql
SELECT array_pushfront([[3,4], [5,6]], [1,2]);
+------------------------------------------+
| array_pushfront([[3,4], [5,6]], [1,2])  |
+------------------------------------------+
| [[1, 2], [3, 4], [5, 6]]                |
+------------------------------------------+
```

MAP 배열의 맨 앞에 요소 추가:
```sql
SELECT array_pushfront([{'b':2}, {'c':3}], {'a':1});
+----------------------------------------------+
| array_pushfront([{'b':2}, {'c':3}], {'a':1}) |
+----------------------------------------------+
| [{"a":1}, {"b":2}, {"c":3}]                 |
+----------------------------------------------+
```

STRUCT 배열의 맨 앞에 요소 추가:
```sql
SELECT array_pushfront(array(named_struct('name','Bob','age',30), named_struct('name','Charlie','age',40)), named_struct('name','Alice','age',20));
+-------------------------------------------------------------------------------------------------------------------------------------------+
| array_pushfront(array(named_struct('name','Bob','age',30), named_struct('name','Charlie','age',40)), named_struct('name','Alice','age',20)) |
+-------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}, {"name":"Charlie", "age":40}]                                                    |
+-------------------------------------------------------------------------------------------------------------------------------------------+
```

매개변수 개수가 잘못된 경우 발생하는 오류:
```sql
SELECT array_pushfront([1,2,3]);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not found function 'array_pushfront' which has 1 arity. Candidate functions are: [array_pushfront(Expression, Expression)]
```

배열이 아닌 타입을 전달할 때 발생하는 오류:
```sql
SELECT array_pushfront('not_an_array', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not find the compatibility function signature: array_pushfront(VARCHAR(12), TINYINT)
```

### 키워드 {#keywords}

ARRAY, PUSHFRONT, ARRAY_PUSHFRONT
