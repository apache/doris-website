---
{
    "title": "ARRAY_APPLY",
    "language": "ko",
    "description": "지정한 비교 연산자로 배열 요소를 필터링하고, 조건을 만족하는 요소를 담은 새 배열을 반환합니다."
}
---

## array_apply {#array_apply}

<version since="1.2.3">


</version>

## 설명 {#description}

지정한 비교 연산자로 배열 요소를 필터링하고, 조건을 만족하는 요소를 담은 새 배열을 반환합니다. 람다 표현식 대신 미리 정의된 연산자를 사용하는 간소화된 배열 필터링 함수입니다.

## 구문 {#syntax}

```sql
array_apply(arr, op, val)
```

### 매개변수 {#parameters}

- `arr`：ARRAY\<T> 타입, 필터링할 배열
- `op`：STRING 타입, 필터링 조건 연산자이며 상수여야 합니다. 지원하는 연산자: `=`, `!=`, `>`, `>=`, `<`, `<=`
- `val`：T 타입, 필터링 조건 값이며 상수여야 합니다.

**T에 지원되는 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2
- 불리언 타입: BOOLEAN

### 반환값 {#return-value}

반환 타입: ARRAY\<T>

반환값의 의미:
- 필터링 조건을 만족하는 모든 요소를 담은 새 배열을 반환합니다.
- NULL: 입력 배열이 NULL이거나 조건 값이 NULL인 경우
- 빈 배열: 조건을 만족하는 요소가 없는 경우

사용 시 참고 사항:
- 연산자와 조건 값은 상수여야 하며, 컬럼 이름이나 표현식은 사용할 수 없습니다.
- 지원하는 타입은 제한적이며, 주로 숫자, 날짜 및 불리언 타입을 지원합니다.
- 빈 배열을 입력하면 빈 배열을 반환하고, NULL 배열을 입력하면 NULL을 반환합니다.
- 배열 요소의 null 값 처리: null 요소는 필터링되어 제외되며 비교 연산에 참여하지 않습니다.

### 예제 {#examples}

```sql
CREATE TABLE array_apply_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    date_array ARRAY<DATE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_apply_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05']),
(2, [10, 20, 30], [10.5, 20.5, 30.5], ['2023-02-01', '2023-02-02', '2023-02-03']),
(3, [], [], []),
(4, NULL, NULL, NULL);
```

**쿼리 예제:**

double_array에서 2보다 큰 요소를 필터링합니다:
```sql
SELECT array_apply(double_array, ">", 2) FROM array_apply_test WHERE id = 1;
+------------------------------------------+
| array_apply(double_array, '>', 2)        |
+------------------------------------------+
| [2.2, 3.3, 4.4, 5.5]                     |
+------------------------------------------+
```

int_array에서 3과 같지 않은 요소를 필터링합니다:
```sql
SELECT array_apply(int_array, "!=", 3) FROM array_apply_test WHERE id = 1;
+------------------------------------------+
| array_apply(int_array, '!=', 3)          |
+------------------------------------------+
| [1, 2, 4, 5]                             |
+------------------------------------------+
```

날짜가 지정한 날짜 이후이거나 같은 date_array 요소를 필터링합니다:
```sql
SELECT array_apply(date_array, ">=", '2023-01-03') FROM array_apply_test WHERE id = 1;
+---------------------------------------------+
| array_apply(date_array, ">=", '2023-01-03') |
+---------------------------------------------+
| ["2023-01-03", "2023-01-04", "2023-01-05"]  |
+---------------------------------------------+
```

빈 배열을 입력하면 빈 배열을 반환합니다:
```sql
SELECT array_apply(int_array, ">", 0) FROM array_apply_test WHERE id = 3;
+------------------------------------------+
| array_apply(int_array, '>', 0)           |
+------------------------------------------+
| []                                        |
+------------------------------------------+
```

NULL 배열을 입력하면 NULL을 반환합니다: 입력 배열이 NULL이면 오류를 발생시키지 않고 NULL을 반환합니다.
```sql
SELECT array_apply(int_array, ">", 0) FROM array_apply_test WHERE id = 4;
+------------------------------------------+
| array_apply(int_array, '>', 0)           |
+------------------------------------------+
| NULL                                      |
+------------------------------------------+
```

null 값이 포함된 배열에서는 null 요소가 필터링되어 제외됩니다:
```sql
SELECT array_apply([1, null, 3, null, 5], ">", 2);
+------------------------------------------+
| array_apply([1, null, 3, null, 5], '>', 2) |
+------------------------------------------+
| [3, 5]                                   |
+------------------------------------------+
```

### 예외 예제 {#exception-examples}

지원하지 않는 연산자:
```sql
SELECT array_apply([1,2,3], "like", 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], 'like', 2), array_apply(arr, op, val): op support =, >=, <=, >, <, !=, but we get like
```

지원하지 않는 문자열 타입:
```sql
SELECT array_apply(['a','b','c'], "=", 'a');
ERROR 1105 (HY000): errCode = 2, detailMessage = array_apply does not support type VARCHAR(1), expression is array_apply(['a', 'b', 'c'], '=', 'a')
```

지원하지 않는 복합 타입:
```sql
SELECT array_apply([[1,2],[3,4]], "=", [1,2]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_apply does not support type ARRAY<TINYINT>, expression is array_apply([[1, 2], [3, 4]], '=', [1, 2])
```

연산자가 상수가 아닌 경우:
```sql
SELECT array_apply([1,2,3], concat('>', '='), 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], concat('>', '='), 2), array_apply(arr, op, val): op support const value only.
```

조건 값이 상수가 아닌 경우:
```sql
SELECT array_apply([1,2,3], ">", id) FROM array_apply_test WHERE id = 1;
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], '>', id), array_apply(arr, op, val): val support const value only.
```

매개변수 개수가 잘못된 경우:
```sql
SELECT array_apply([1,2,3], ">");
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_apply' which has 2 arity. Candidate functions are: [array_apply(Expression, Expression, Expression)]
```

배열이 아닌 타입을 전달한 경우:
```sql
SELECT array_apply('not_an_array', ">", 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.VarcharType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.VarcharType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

### 키워드 {#keywords}

ARRAY, APPLY, ARRAY_APPLY
