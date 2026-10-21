---
{
    "title": "ARRAY | 배열 함수",
    "language": "ko",
    "description": "배열을 생성합니다. 매개변수를 생략하거나 하나 이상 지정할 수 있으며, 모든 입력 요소가 포함된 배열을 반환합니다.",
    "sidebar_label": "ARRAY"
}
---

# ARRAY {#array}

## array {#array-1}

<version since="2.0.0">

</version>

## 설명 {#description}

배열을 생성합니다. 매개변수를 생략하거나 하나 이상 지정할 수 있으며, 모든 입력 요소가 포함된 배열을 반환합니다.

## 구문 {#syntax}

```sql
array([element1, element2, ...])
```

### 매개변수 {#parameters}

- `element1, element2, ...`: 배열에 포함할 요소로, 모든 타입을 사용할 수 있습니다. 매개변수는 생략하거나 하나 이상 지정할 수 있습니다.

**지원되는 요소 타입:**
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
- 모든 입력 요소가 포함된 배열을 반환합니다.
- 빈 배열: 입력 매개변수가 없는 경우

사용 시 참고 사항:
- 이 함수는 데이터 타입이 같은 모든 입력 요소를 하나의 배열로 결합합니다. 요소 타입이 호환되지 않으면 타입 변환을 시도합니다.
- 복합 타입과 기본 타입은 호환되지 않아 하나의 배열로 결합할 수 없으며, 서로 다른 복합 타입끼리도 결합할 수 없습니다.
- 매개변수는 생략하거나 하나 이상 지정할 수 있습니다.

**쿼리 예제:**

여러 요소가 포함된 배열 생성:
```sql
SELECT array(1, 2, 3, 4, 5);
+----------------------+
| array(1, 2, 3, 4, 5) |
+----------------------+
| [1, 2, 3, 4, 5]     |
+----------------------+
```

서로 다른 타입의 요소가 포함된 배열 생성:
```sql
SELECT array(1, 'hello', 3.14, true);
+-------------------------------+
| array(1, 'hello', 3.14, true) |
+-------------------------------+
| ["1", "hello", "3.14", "1"]   |
+-------------------------------+
```

빈 배열 생성:
```sql
SELECT array();
+----------+
| array()  |
+----------+
| []       |
+----------+
```

null 요소가 포함된 배열 생성:
```sql
SELECT array(1, null, 3, null, 5);
+--------------------------------+
| array(1, null, 3, null, 5)    |
+--------------------------------+
| [1, null, 3, null, 5]         |
+--------------------------------+
```

### 복합 타입 예제 {#complex-type-examples}

배열이 포함된 배열 생성:
```sql
SELECT array([1,2], [3,4], [5,6]);
+----------------------------+
| array([1,2], [3,4], [5,6]) |
+----------------------------+
| [[1, 2], [3, 4], [5, 6]]   |
+----------------------------+
```

맵이 포함된 배열 생성:
```sql
SELECT array({'a':1}, {'b':2}, {'c':3});
+----------------------------------+
| array({'a':1}, {'b':2}, {'c':3}) |
+----------------------------------+
| [{"a":1}, {"b":2}, {"c":3}]      |
+----------------------------------+
```

구조체가 포함된 배열 생성:
```sql
SELECT array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30));
+-----------------------------------------------------------------------------------+
| array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30)) |
+-----------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}]                            |
+-----------------------------------------------------------------------------------+
```

복합 타입과 기본 타입을 혼합하면 오류가 발생합니다:
```sql
SELECT array([1,2], 'hello');
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<TINYINT> to target type=TEXT
```

서로 다른 복합 타입을 혼합하면 오류가 발생합니다:
```sql
SELECT array([1,2], named_struct('name','Alice','age',20));
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array(ARRAY<TINYINT>, STRUCT<name:VARCHAR(5),age:TINYINT>)
```

### 키워드 {#keywords}

ARRAY
