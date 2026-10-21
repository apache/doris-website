---
{
    "title": "ARRAY_COMPACT",
    "language": "ko",
    "description": "배열에서 연속으로 중복되는 요소를 제거하고, 연속된 같은 값 중 처음 나타나는 요소만 유지합니다."
}
---

## array_compact {#array_compact}

<version since="2.0.0">


</version>

## 설명 {#description}

배열에서 연속으로 중복되는 요소를 제거하고, 연속된 같은 값 중 처음 나타나는 요소만 유지합니다. 이 함수는 배열을 왼쪽에서 오른쪽으로 순회하면서 이전 요소와 같은 요소는 건너뛰고, 연속된 같은 값 중 첫 번째 요소만 유지합니다.

## 구문 {#syntax}

```sql
array_compact(ARRAY<T> arr)
```

### 매개변수 {#parameters}

- `arr`：ARRAY<T> 타입으로, 중복을 제거할 배열입니다. 컬럼 이름이나 상숫값을 사용할 수 있습니다.

**T로 지원되는 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6
- 복합 데이터 타입: ARRAY

### 반환 값 {#return-value}

반환 타입: ARRAY\<T>

반환 값의 의미:
- 연속으로 중복되는 요소 중 첫 번째 요소만 유지한 배열
- NULL: 입력 배열이 NULL인 경우

반환 값의 동작 설명:

1. 일반적인 중복 제거 동작:
   - 배열을 왼쪽에서 오른쪽으로 순회하면서 각 요소가 처음 나타나면 유지하고, 이전 요소와 같은 요소가 연속해서 나타나면 건너뜁니다.
   - 연속된 중복 요소만 제거하며, 연속되지 않은 중복 요소는 유지합니다.
   - null 값을 유지합니다(null과 null은 같은 값으로 간주합니다).

2. 경계 조건에서의 동작:
   - 입력 배열이 비어 있으면 빈 배열을 반환합니다.
   - 입력 배열이 NULL이면 NULL을 반환합니다.
   - 배열에 요소가 하나만 있으면 원래 배열을 반환합니다.

사용 시 참고 사항:

- 배열 요소의 원래 순서를 유지합니다.
- 연속된 중복 요소만 제거하며, 배열 전체에 걸친 중복 제거는 수행하지 않습니다.
- map, struct는 중복 제거 로직을 지원하지 않습니다.
- 배열 요소의 null 값 처리: null 요소는 일반 값처럼 처리되며, 연속된 여러 null 요소는 하나로 병합됩니다.

### 예제 {#examples}

```sql
CREATE TABLE array_compact_test (
    id INT,
    int_array ARRAY<INT>,
    string_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_compact_test VALUES
(1, [1, 1, 2, 2, 2, 3, 1, 4], ['a', 'a', 'b', 'b', 'c']),
(2, [1, 2, 3, 1, 2, 3], ['a', 'b', 'a', 'b']),
(3, [1, null, null, 2, null, null, 3], ['a', null, null, 'b']),
(4, [], []),
(5, NULL, NULL);
```

**쿼리 예제:**

string_array에서 연속된 중복 제거: 서로 인접한 'a' 또는 'b'의 중복만 제거하고, 'c'는 유지합니다.
```sql
SELECT array_compact(string_array) FROM array_compact_test WHERE id = 1;
+-----------------------------+
| array_compact(string_array) |
+-----------------------------+
| ["a", "b", "c"]             |
+-----------------------------+
```

연속되지 않은 중복 요소는 제거하지 않으며, 원래 순서와 내용을 유지합니다.
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 2;
+-------------------------------+
| array_compact(int_array)      |
+-------------------------------+
| [1, 2, 3, 1, 2, 3]            |
+-------------------------------+
```

null 값이 포함된 배열에서는 연속된 null 중 하나만 유지합니다. null은 일반 값처럼 처리되므로, 연속된 null은 하나만 유지하고 연속되지 않은 null은 병합하지 않습니다.
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 3;
+------------------------------------------+
| array_compact(int_array)                 |
+------------------------------------------+
| [1, null, 2, null, 3]                    |
+------------------------------------------+
```

복합 타입 예제:

중첩 배열 타입에서 연속된 중복을 제거합니다. 서로 인접하고 내용이 완전히 같은 하위 배열의 중복만 제거하며, 연속되지 않은 하위 배열의 중복은 제거하지 않습니다.
```sql
SELECT array_compact([[1,2],[1,2],[3,4],[3,4]]);
+------------------------------------------+
| array_compact([[1,2],[1,2],[3,4],[3,4]]) |
+------------------------------------------+
| [[1,2],[3,4]]                            |
+------------------------------------------+
```

빈 배열은 빈 배열을 반환합니다:
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 4;
+----------------------+
| array_compact(int_array) |
+----------------------+
| []                   |
+----------------------+
```

NULL 배열은 NULL을 반환합니다:
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 5;
+----------------------+
| array_compact(int_array) |
+----------------------+
| NULL                 |
+----------------------+
```

요소가 하나만 있는 배열은 원래 배열을 반환합니다:
```sql
SELECT array_compact([42]);
+----------------------+
| array_compact([42])  |
+----------------------+
| [42]                 |
+----------------------+
```

매개변수를 여러 개 전달하면 오류가 발생합니다.
```sql
SELECT array_compact([1,2,3],[4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_compact' which has 2 arity. Candidate functions are: [array_compact(Expression)]
```

배열이 아닌 타입을 전달하면 오류가 발생합니다.
```sql
SELECT array_compact('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_compact(VARCHAR(12))
```

### 키워드 {#keywords}

ARRAY, COMPACT, ARRAY_COMPACT
