---
{
    "title": "ARRAY_AVG",
    "language": "ko",
    "description": "배열의 모든 숫자 요소의 평균을 계산합니다. 이 함수는 배열의 null 값과 숫자가 아닌 요소를 건너뜁니다."
}
---

## array_avg {#array_avg}

<version since="2.0.0">

</version>

## 설명 {#description}

배열의 모든 숫자 요소의 평균을 계산합니다. 이 함수는 배열의 null 값과 숫자가 아닌 요소를 건너뛰고, 유효한 숫자 요소만으로 평균을 계산합니다.

## 구문 {#syntax}

```sql
array_avg(ARRAY<T> arr)
```

### 매개변수 {#parameters}

- `arr`：ARRAY<T> 타입으로, 평균을 계산할 배열입니다. 컬럼 이름이나 상수 값을 사용할 수 있습니다.

**지원되는 T의 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING (숫자로 변환을 시도함)
- 불리언 타입: BOOLEAN (숫자로 변환을 시도함)

### 반환 값 {#return-value}

반환 타입: 입력 타입에 따라 자동으로 선택됩니다.

반환 값의 의미:
- 배열의 모든 유효한 숫자 요소의 평균을 반환합니다.
- NULL: 배열이 비어 있거나, 모든 요소가 NULL이거나 숫자로 변환할 수 없는 경우입니다.

사용 시 참고 사항:
- 배열에 문자열과 같은 다른 타입이 포함되어 있으면 요소를 DOUBLE 타입으로 변환하려고 시도합니다. 변환에 실패한 요소는 건너뛰며 평균 계산에 포함하지 않습니다.
- 이 함수는 평균을 계산하기 위해 모든 요소를 호환되는 숫자 타입으로 변환하려고 시도합니다. 평균의 반환 타입은 입력 타입에 따라 자동으로 선택됩니다.
  - 입력이 DOUBLE 또는 FLOAT이면 DOUBLE을 반환합니다.
  - 입력이 정수 타입이면 DOUBLE을 반환합니다.
  - 입력이 DECIMAL이면 원래의 precision과 scale을 유지한 DECIMAL을 반환합니다.
- 빈 배열은 NULL을 반환하고, 요소가 하나뿐인 배열은 해당 요소의 값을 반환합니다.
- 배열이 NULL이면 타입 변환 오류를 반환합니다.
- 중첩 배열, MAP, STRUCT 및 기타 복합 타입은 평균 계산을 지원하지 않으며, 호출하면 오류가 발생합니다.
- 배열 요소에 null 값이 있는 경우, null 요소는 평균 계산에 포함하지 않습니다.

### 예제 {#examples}

```sql
CREATE TABLE array_avg_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    mixed_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_avg_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['1', '2', '3', '4', '5']),
(2, [10, 20, 30], [10.5, 20.5, 30.5], ['10', '20', '30']),
(3, [], [], []),
(4, NULL, NULL, NULL),
(5, [1, null, 3, null, 5], [1.1, null, 3.3, null, 5.5], ['1', null, '3', null, '5']);
```

**쿼리 예제:**

double_array의 평균을 계산합니다:
```sql
SELECT array_avg(double_array) FROM array_avg_test WHERE id = 1;
+-------------------------+
| array_avg(double_array) |
+-------------------------+
|                     3.3 |
+-------------------------+
```

타입이 혼합된 배열의 평균을 계산합니다. 문자열은 숫자로 변환됩니다:
```sql
SELECT array_avg(mixed_array) FROM array_avg_test WHERE id = 1;
+------------------------+
| array_avg(mixed_array) |
+------------------------+
|                      3 |
+------------------------+
```

빈 배열은 NULL을 반환합니다:
```sql
SELECT array_avg(int_array) FROM array_avg_test WHERE id = 3;
+----------------------+
| array_avg(int_array) |
+----------------------+
|                 NULL |
+----------------------+
```

NULL 배열은 NULL을 반환합니다:
```sql
SELECT array_avg(int_array) FROM array_avg_test WHERE id = 4;
+----------------------+
| array_avg(int_array) |
+----------------------+
|                 NULL |
+----------------------+
```

null 값이 포함된 배열에서 null 요소는 계산에 포함하지 않습니다:
```sql
SELECT array_avg(int_array) FROM array_avg_test WHERE id = 5;
+----------------------+
| array_avg(int_array) |
+----------------------+
|                    3 |
+----------------------+
```

복합 타입 예제:

중첩 배열 타입은 지원되지 않으며 오류가 발생합니다:
```sql
SELECT array_avg([[1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_avg([[1, 2, 3]]) does not support type: ARRAY<TINYINT>
```

Map 타입은 지원되지 않으며 오류가 발생합니다:
```sql
SELECT array_avg([{'k':1},{'k':2}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_avg([map('k', 1), map('k', 2)]) does not support type: MAP<VARCHAR(1),TINYINT>
```

매개변수 개수가 잘못된 경우 오류가 발생합니다:
```sql
SELECT array_avg([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_avg' which has 2 arity. Candidate functions are: [array_avg(Expression)]
```

배열이 아닌 타입을 전달하면 오류가 발생합니다:
```sql
SELECT array_avg('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_avg(VARCHAR(12))
```

배열이 NULL이면 타입 변환 오류를 반환합니다.
```
mysql> SELECT array_avg(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.NullType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.NullType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

### 키워드 {#keywords}

ARRAY, AVG, ARRAY_AVG
