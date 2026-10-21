---
{
    "title": "ARRAY_CONTAINS",
    "language": "ko",
    "description": "<version since=\"1.2.0\">"
}
---

## array_contains {#array_contains}

<version since="1.2.0">


</version>

## 설명 {#description}

배열에 지정된 값이 포함되어 있는지 확인합니다. 포함되어 있으면 true를, 그렇지 않으면 false를 반환합니다. 배열이 NULL이면 NULL을 반환합니다.

## 구문 {#syntax}

```sql
array_contains(ARRAY<T> arr, T value)
```

### 매개변수 {#parameters}

- `arr`：ARRAY<T> 타입으로, 확인할 배열입니다. 컬럼 이름이나 상수 값을 지원합니다.
- `value`：T 타입으로, 검색할 값입니다. 배열 요소의 타입과 호환되어야 합니다.

**지원되는 T 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6

### 반환 값 {#return-value}

반환 타입: BOOLEAN

반환 값의 의미:
- true: 배열에 지정된 값이 포함되어 있는 경우
- false: 배열에 지정된 값이 포함되어 있지 않은 경우
- NULL: 입력 배열이 NULL인 경우

반환 값의 동작 설명:

1. 경계 조건에서의 동작:
   - 입력 배열이 비어 있으면 false를 반환합니다
   - 입력 배열이 NULL이면 NULL을 반환합니다
   - 배열 요소의 타입이 검색 값의 타입과 일치하지 않으면 false를 반환합니다
   - 배열 요소의 null 값: null 요소도 정상적으로 처리되므로 배열에서 null 요소를 검색할 수 있습니다

2. 예외적인 값에 대한 동작:
   - 배열 요소가 지원되지 않는 타입이면 지원되지 않는 타입 오류를 반환합니다

3. NULL을 반환하는 경우:
   - 입력 배열이 NULL인 경우

**타입 호환성 규칙:**
1. **숫자 타입 호환성**:
   - 정수 타입끼리 서로 비교할 수 있습니다(TINYINT, SMALLINT, INT, BIGINT, LARGEINT)
   - 부동 소수점 타입끼리 서로 비교할 수 있습니다(FLOAT, DOUBLE)
   - 고정 소수점 타입끼리 서로 비교할 수 있습니다(DECIMAL32, DECIMAL64, DECIMAL128I, DECIMALV2, DECIMAL256)
   - 정수와 부동 소수점 수를 서로 비교할 수 있습니다
2. **문자열 타입 호환성**:
   - CHAR, VARCHAR, STRING 타입을 서로 비교할 수 있습니다
3. **날짜 및 시간 타입 호환성**:
   - DATE와 DATEV2를 서로 비교할 수 있습니다
   - DATETIME과 DATETIMEV2를 서로 비교할 수 있습니다

### 예제 {#examples}

**테이블 생성 예제**
```sql
CREATE TABLE array_contains_test (
    id INT,
    int_array ARRAY<INT>,
    string_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO array_contains_test VALUES
(1, [1000, 2000, 3000], ['apple', 'banana', 'cherry']),
(2, [], []),
(3, NULL, NULL),
(4, [1000, null, 3000], ['apple', null, 'cherry']);
```

**쿼리 예제:**

배열에 특정 정수 값이 포함되어 있는지 확인합니다. 이 예제에서는 int_array에 5가 없으므로 false를 반환합니다.
```sql
SELECT array_contains(int_array, 5) FROM array_contains_test WHERE id = 1;
+-------------------------------+
| array_contains(int_array, 5)  |
+-------------------------------+
| 0                             |
+-------------------------------+
```

문자열 배열에 특정 문자열이 포함되어 있는지 확인합니다. 이 예제에서는 string_array에 'banana'가 있으므로 true를 반환합니다.
```sql
SELECT array_contains(string_array, 'banana') FROM array_contains_test WHERE id = 1;
+------------------------------------------+
| array_contains(string_array, 'banana')   |
+------------------------------------------+
| 1                                        |
+------------------------------------------+
```

현재 배열은 빈 배열입니다. 이 예제에서는 빈 배열에 값이 없으므로 false를 반환합니다.
```sql
SELECT array_contains(int_array, 1000) FROM array_contains_test WHERE id = 2;
+----------------------------------+
| array_contains(int_array, 1000)  |
+----------------------------------+
| 0                                |
+----------------------------------+
```

현재 배열은 NULL 배열이므로 이 예제에서는 NULL을 반환합니다.
```sql
SELECT array_contains(int_array, 1000) FROM array_contains_test WHERE id = 3;
+----------------------------------+
| array_contains(int_array, 1000)  |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

배열에 null이 포함되어 있는지 확인합니다
이 예제에서는 value_expr 매개변수가 null이고 배열에 null 요소가 없으므로 false를 반환합니다.
```sql
SELECT array_contains([1, 2, 3], null);
+---------------------------------+
| array_contains([1, 2, 3], null) |
+---------------------------------+
|                               0 |
+---------------------------------+
```

배열에 null이 포함되어 있는지 확인합니다
이 예제에서는 value_expr 매개변수가 null이고 배열에 SQL null 값이 포함되어 있으므로 true를 반환합니다.
```sql
SELECT array_contains([null, 1, 2], null);
+------------------------------------+
| array_contains([null, 1, 2], null) |
+------------------------------------+
|                                  1 |
+------------------------------------+
```

검색 값의 타입이 배열 요소의 타입과 호환되지 않으면 false를 반환합니다.
```sql
SELECT array_contains([1, 2, 3], 'string');
+-------------------------------------+
| array_contains([1, 2, 3], 'string') |
+-------------------------------------+
| 0                                   |
+-------------------------------------+
```

검색 값의 타입을 배열 요소의 타입으로 변환할 수 없으면 오류를 반환합니다
```sql
SELECT array_contains([1, 2, 3], [4, 5, 6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<TINYINT> to target type=TINYINT
```

지원되지 않는 복합 타입은 오류를 발생시킵니다. 이 예제에서는 배열이 중첩 배열 타입이므로 지원되지 않는 타입 오류를 반환합니다.
```sql
SELECT array_contains([[1,2],[2,3]], [1,2]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_contains(Array(Nullable(Array(Nullable(TINYINT)))), Array(Nullable(TINYINT)))
```

### 참고 사항 {#notes}

성능 고려 사항: 큰 배열을 처리할 때 성능이 중요하다면 역색인을 사용하여 쿼리를 가속할 수 있습니다. 다만 다음과 같은 사용 제약 사항에 유의해야 합니다:

1. 배열 역색인은 비토큰화 인덱스로만 생성할 수 있습니다
2. 배열의 요소 타입 T는 역색인 생성을 지원하는 데이터 타입이어야 합니다
3. 쿼리 조건의 매개변수 T가 NULL이면 인덱스를 사용하여 가속할 수 없습니다
4. 함수가 조건자 필터 조건으로 사용될 때만 인덱스 가속이 적용됩니다

```sql
-- Table creation example
CREATE TABLE `test_array_index` (
    `apply_date` date NULL COMMENT '',
    `id` varchar(60) NOT NULL COMMENT '',
    `inventors` array<text> NULL COMMENT '' -- Add non-tokenized inverted index to array column when creating table
  ) ENGINE=OLAP
  DUPLICATE KEY(`apply_date`, `id`)
  COMMENT 'OLAP'
  DISTRIBUTED BY HASH(`id`) BUCKETS 1
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 1",
  "storage_format" = "V2",
  "light_schema_change" = "true",
  "disable_auto_compaction" = "false"
  );
-- Query example
SELECT id, inventors FROM test_array_index WHERE array_contains(inventors, 'x') ORDER BY id;
```

### 키워드 {#keywords}

ARRAY, CONTAIN, CONTAINS, ARRAY_CONTAINS
