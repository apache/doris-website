---
{
    "title": "ARRAY_JOIN",
    "language": "ko",
    "description": "배열의 요소를 하나의 문자열로 연결합니다. 이 함수는 배열의 모든 요소를 문자열로 변환한 다음 구분자로 연결합니다. "
}
---

## array_join {#array_join}

<version since="2.0.0">

</version>

## 설명 {#description}

배열의 요소를 하나의 문자열로 연결합니다. 이 함수는 배열의 모든 요소를 문자열로 변환한 다음 지정된 구분자로 연결합니다.

## 구문 {#syntax}

```sql
array_join(ARRAY<T> arr, STRING separator [, STRING null_replacement])
```

### 매개변수 {#parameters}

- `arr`：ARRAY<T> 타입으로, 연결할 배열입니다.
- `separator`：STRING 타입의 필수 매개변수로, 배열 요소 사이에 사용할 구분자입니다.
- `null_replacement`：STRING 타입의 선택적 매개변수로, 배열의 null 값을 대체할 문자열입니다. 이 매개변수를 제공하지 않으면 null 값을 건너뜁니다.

**T에 지원되는 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6

### 반환 값 {#return-value}

반환 타입: STRING

반환 값의 의미:
- 배열의 모든 요소를 구분자로 연결한 문자열을 반환합니다.
- NULL: 입력 배열이 NULL인 경우

사용 시 참고 사항:
- 이 함수는 배열의 각 요소를 문자열로 변환하고 지정된 구분자로 연결합니다.
- 배열 요소가 null인 경우:
  - `null_replacement` 매개변수를 제공하면 null 요소를 해당 문자열로 대체합니다.
  - `null_replacement` 매개변수를 제공하지 않으면 null 요소를 건너뜁니다.
- 빈 배열은 빈 문자열을 반환합니다.

**쿼리 예제:**

배열을 구분자로 연결하기:
```sql
SELECT array_join([1, 2, 3, 4, 5], ',');
+--------------------------------------+
| array_join([1, 2, 3, 4, 5], ',')    |
+--------------------------------------+
| 1,2,3,4,5                           |
+--------------------------------------+
```

문자열 배열을 공백 구분자로 연결하기:
```sql
SELECT array_join(['hello', 'world', 'doris'], ' ');
+--------------------------------------------------+
| array_join(['hello', 'world', 'doris'], ' ')    |
+--------------------------------------------------+
| hello world doris                                |
+--------------------------------------------------+
```

null 값이 포함된 배열 연결하기(null 값은 건너뜀):
```sql
SELECT array_join([1, null, 3, null, 5], '-');
+--------------------------------------------+
| array_join([1, null, 3, null, 5], '-')    |
+--------------------------------------------+
| 1-3-5                                      |
+--------------------------------------------+
```

null_replacement 매개변수로 null 값 대체하기:
```sql
SELECT array_join([1, null, 3, null, 5], '-', 'NULL');
+--------------------------------------------------+
| array_join([1, null, 3, null, 5], '-', 'NULL')  |
+--------------------------------------------------+
| 1-NULL-3-NULL-5                                 |
+--------------------------------------------------+
```

부동 소수점 배열 연결하기:
```sql
SELECT array_join([1.1, 2.2, 3.3], ' | ');
+------------------------------------------+
| array_join([1.1, 2.2, 3.3], ' | ')      |
+------------------------------------------+
| 1.1 | 2.2 | 3.3                         |
+------------------------------------------+
```

날짜 배열 연결하기:
```sql
SELECT array_join(CAST(['2023-01-01', '2023-06-15', '2023-12-31'] AS ARRAY<DATETIME>), ' to ');
+-----------------------------------------------------------------------------------------+
| array_join(CAST(['2023-01-01', '2023-06-15', '2023-12-31'] AS ARRAY<DATETIME>), ' to ') |
+-----------------------------------------------------------------------------------------+
| 2023-01-01 00:00:00 to 2023-06-15 00:00:00 to 2023-12-31 00:00:00                       |
+-----------------------------------------------------------------------------------------+
```

IP 주소 배열 연결하기:
```sql
SELECT array_join(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), ' -> ');
+----------------------------------------------------------------------------------+
| array_join(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), ' -> ') |
+----------------------------------------------------------------------------------+
| 192.168.1.1 -> 192.168.1.2 -> 192.168.1.3                                       |
+----------------------------------------------------------------------------------+
```

빈 배열은 빈 문자열을 반환합니다:
```sql
SELECT array_join([], ',');
+----------------------+
| array_join([], ',')  |
+----------------------+
|                      |
+----------------------+
```

NULL 배열은 NULL을 반환합니다:
```sql
SELECT array_join(NULL, ',');
+----------------------+
| array_join(NULL, ',') |
+----------------------+
| NULL                 |
+----------------------+
```

복합 타입을 전달할 때 발생하는 오류:
```sql
SELECT array_join([{'name':'Alice','age':20}, {'name':'Bob','age':30}], '; ');
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<MAP<TEXT,TEXT>> to target type=ARRAY<VARCHAR(65533)>
```

매개변수 개수가 잘못되었을 때 발생하는 오류:
```sql
SELECT array_join([1,2,3], ',', 'extra', 'too_many');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_join' which has 4 arity. Candidate functions are: [array_join(Expression, Expression, Expression), array_join(Expression, Expression)]
```

배열이 아닌 타입을 전달할 때 발생하는 오류:
```sql
SELECT array_join('not_an_array', ',');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_join(VARCHAR(12), VARCHAR(1))
```

### 키워드 {#keywords}

ARRAY, JOIN, ARRAY_JOIN
