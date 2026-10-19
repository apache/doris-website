---
{
    "title": "ARRAY_CONCAT",
    "language": "ko",
    "description": "모든 입력 배열을 하나의 배열로 연결합니다. 이 함수는 하나 이상의 배열을 매개변수로 받아 새 배열로 연결합니다."
}
---

## array_concat {#array_concat}

<version since="2.0.0">


</version>

## 설명 {#description}

모든 입력 배열을 하나의 배열로 연결합니다. 이 함수는 하나 이상의 배열을 매개변수로 받아 매개변수 순서대로 새 배열로 연결합니다.

## 구문 {#syntax}

```sql
array_concat(ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```

### 매개변수 {#parameters}

- `arr1, arr2, ...`：ARRAY\<T> 타입으로, 연결할 배열입니다. 컬럼 이름이나 상수 값을 지원합니다.

**T가 지원하는 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2, TIMESTAMP_NS
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6
- UUID: [UUID](../../../basic-element/sql-data-types/uuid.md)
- 복합 데이터 타입: ARRAY, MAP, STRUCT

### 반환값 {#return-value}

반환 타입: ARRAY\<T>

반환값의 의미:
- 입력 배열의 모든 요소를 원래 순서대로 포함하는, 연결된 새 배열
- NULL: 입력 배열 중 하나라도 NULL인 경우

사용 시 참고 사항:
- 빈 배열은 무시되며 요소를 추가하지 않습니다
- 배열이 하나뿐이고 해당 배열이 비어 있으면 빈 배열을 반환합니다. 배열이 하나뿐이고 해당 배열이 NULL이면 NULL을 반환합니다
- 복합 타입(중첩 배열, MAP, STRUCT)을 연결할 때는 구조가 완전히 일치해야 하며, 그렇지 않으면 오류가 발생합니다
- 배열 요소의 null 값: null 요소는 연결 결과에 그대로 유지됩니다

### 예제 {#examples}

```sql
CREATE TABLE array_concat_test (
    id INT,
    int_array1 ARRAY<INT>,
    int_array2 ARRAY<INT>,
    string_array1 ARRAY<STRING>,
    string_array2 ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_concat_test VALUES
(1, [1, 2, 3], [4, 5, 6], ['a', 'b'], ['c', 'd']),
(2, [10, 20], [30, 40], [], ['x', 'y']),
(3, NULL, [100, 200], NULL, ['z']),
(4, [], [], [], []),
(5, [1, null, 3], [null, 5, 6], ['a', null, 'c'], ['d', 'e']);
```

**쿼리 예제:**

여러 배열 리터럴 연결:
```sql
SELECT array_concat([1, 2], [7, 8], [5, 6]);
+--------------------------------------+
| array_concat([1, 2], [7, 8], [5, 6]) |
+--------------------------------------+
| [1, 2, 7, 8, 5, 6]                   |
+--------------------------------------+
```

문자열 배열 연결:
```sql
SELECT array_concat(string_array1, string_array2) FROM array_concat_test WHERE id = 1;
+--------------------------------------------+
| array_concat(string_array1, string_array2) |
+--------------------------------------------+
| ["a", "b", "c", "d"]                       |
+--------------------------------------------+
```

빈 배열 연결:
```sql
SELECT array_concat([], []);
+----------------------+
| array_concat([], []) |
+----------------------+
| []                   |
+----------------------+
```

NULL 배열 연결:
```sql
SELECT array_concat(int_array1, int_array2) FROM array_concat_test WHERE id = 3;
+--------------------------------------+
| array_concat(int_array1, int_array2) |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```

null 요소가 포함된 배열 연결: null 요소는 연결 결과에 그대로 유지됩니다.
```sql
SELECT array_concat(int_array1, int_array2) FROM array_concat_test WHERE id = 5;
+--------------------------------------+
| array_concat(int_array1, int_array2) |
+--------------------------------------+
| [1, null, 3, null, 5, 6]             |
+--------------------------------------+
```

타입 호환성 예제: int_array1과 string_array1을 연결하면 정수 요소가 문자열로 변환되며 모든 요소가 유지됩니다.
```sql
SELECT array_concat(int_array1, string_array1) FROM array_concat_test WHERE id = 1;
+-----------------------------------------+
| array_concat(int_array1, string_array1) |
+-----------------------------------------+
| ["1", "2", "3", "a", "b"]            |
+-----------------------------------------+
```

복합 타입 예제:

중첩 배열 연결: 구조가 일치하면 연결할 수 있습니다.
```sql
SELECT array_concat([[1,2],[3,4]], [[5,6],[7,8]]);
+--------------------------------------------+
| array_concat([[1,2],[3,4]], [[5,6],[7,8]]) |
+--------------------------------------------+
| [[1, 2], [3, 4], [5, 6], [7, 8]]           |
+--------------------------------------------+
```

중첩 배열의 구조가 일치하지 않으면 오류가 발생합니다.
```sql
SELECT array_concat([[1,2]], [{'k':1}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<ARRAY<INT>> to target type=ARRAY<DOUBLE>
```

Map 타입 연결: 구조가 일치하면 연결할 수 있습니다.
```sql
SELECT array_concat([{'k':1}], [{'k':2}]);
+------------------------------------+
| array_concat([{'k':1}], [{'k':2}]) |
+------------------------------------+
| [{"k":1}, {"k":2}]                 |
+------------------------------------+
```

Struct 타입 연결: 구조가 일치하면 연결할 수 있습니다.
```sql
SELECT array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('name','Bob','age',30)));
+--------------------------------------------------------------------------------------------------------+
| array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('name','Bob','age',30))) |
+--------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}]                                                 |
+--------------------------------------------------------------------------------------------------------+
```

struct의 구조가 일치하지 않으면 오류가 발생합니다.
```sql
SELECT array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('id',1,'score',95.5,'age',10)));
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<STRUCT<name:VARCHAR(5),age:TINYINT>> to target type=ARRAY<DOUBLE>
```

매개변수 개수가 올바르지 않으면 오류가 발생합니다.
```sql
SELECT array_concat();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_concat' which has 0 arity. Candidate functions are: [array_concat(Expression, Expression, ...)]
```

배열이 아닌 타입을 전달하면 오류가 발생합니다.
```sql
SELECT array_concat('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_concat(VARCHAR(12))
```

### 참고 사항 {#notes}

모든 입력 배열의 요소 타입이 호환되는지 확인하세요. 특히 중첩된 복합 타입은 런타임 타입 변환 오류를 방지할 수 있도록 구조가 일치해야 합니다.

### 키워드 {#keywords}

ARRAY, CONCAT, ARRAY_CONCAT
