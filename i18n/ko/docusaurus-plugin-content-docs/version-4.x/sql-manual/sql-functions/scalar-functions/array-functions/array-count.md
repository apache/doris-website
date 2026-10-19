---
{
    "title": "ARRAY_COUNT",
    "language": "ko",
    
}
---

## array_count {#array_count}

<version since="2.0.0">

</version>

## 설명 {#description}

배열의 요소에 람다 표현식을 적용하고 반환 값이 0이 아닌 요소의 개수를 셉니다.

## 구문 {#syntax}

```sql
array_count(lambda, array1, ...)
```

### 매개변수 {#parameters}

- `lambda`：배열 요소를 평가하고 계산하는 데 사용하는 람다 표현식
- `array1, ...`：하나 이상의 ARRAY\<T> 타입 매개변수

**지원되는 T 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6
- 복합 데이터 타입: ARRAY, MAP, STRUCT

### 반환 값 {#return-value}

반환 타입: BIGINT

반환 값의 의미:
- 람다 표현식의 결과가 true인 요소의 개수를 반환합니다
- 0: 조건을 만족하는 요소가 없거나 입력 배열이 NULL인 경우

사용 시 참고 사항:
- 람다 표현식의 매개변수 개수는 배열 매개변수 개수와 일치해야 합니다
- 모든 입력 배열의 길이는 같아야 합니다
- 여러 배열과 복합 타입 배열의 요소 개수를 셀 수 있습니다
- 빈 배열은 0을 반환하고, NULL 배열은 0을 반환합니다
- 람다 표현식에서 다른 고차 함수를 호출할 수 있지만 반환 타입이 호환되어야 합니다
- 배열 요소의 null 값 처리: null 요소는 처리를 위해 람다 표현식에 전달되며, 람다에서 null 값을 평가할 수 있습니다

### 예제 {#examples}

```sql
CREATE TABLE array_count_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    string_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_count_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['a', 'bb', 'ccc', 'dddd', 'eeeee']),
(2, [1, null, 3, null, 5], [1.1, null, 3.3, null, 5.5], ['a', null, 'ccc', null, 'eeeee']),
(3, [], [], []),
(4, NULL, NULL, NULL);
```

**쿼리 예제:**

int_array에서 2보다 큰 요소의 개수 세기:
```sql
SELECT array_count(x -> x > 2, int_array) FROM array_count_test WHERE id = 1;
+-------------------------------------+
| array_count(x -> x > 2, int_array)  |
+-------------------------------------+
|                                   3 |
+-------------------------------------+
```

double_array에서 3 이상인 요소의 개수 세기:
```sql
SELECT array_count(x -> x >= 3, double_array) FROM array_count_test WHERE id = 1;
+------------------------------------------+
| array_count(x -> x >= 3, double_array)   |
+------------------------------------------+
|                                        3 |
+------------------------------------------+
```

string_array에서 길이가 2보다 큰 요소의 개수 세기:
```sql
SELECT array_count(x -> length(x) > 2, string_array) FROM array_count_test WHERE id = 1;
+--------------------------------------------------+
| array_count(x -> length(x) > 2, string_array)    |
+--------------------------------------------------+
|                                              3   |
+--------------------------------------------------+
```

빈 배열에 대한 계산:
```sql
SELECT array_count(x -> x > 0, int_array) FROM array_count_test WHERE id = 3;
+-------------------------------------+
| array_count(x -> x > 0, int_array)  |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```

NULL 배열에 대한 계산:
```sql
SELECT array_count(x -> x > 0, int_array) FROM array_count_test WHERE id = 4;
+-------------------------------------+
| array_count(x -> x > 0, int_array)  |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```

null 값을 포함하는 배열에서 null 요소의 개수 세기:
```sql
SELECT array_count(x -> x is null, int_array) FROM array_count_test WHERE id = 2;
+------------------------------------------+
| array_count(x -> x is null, int_array)   |
+------------------------------------------+
|                                        2 |
+------------------------------------------+
```

null 값을 포함하는 배열에서 null이 아닌 요소의 개수 세기:
```sql
SELECT array_count(x -> x is not null, int_array) FROM array_count_test WHERE id = 2;
+----------------------------------------------+
| array_count(x -> x is not null, int_array)   |
+----------------------------------------------+
|                                            3 |
+----------------------------------------------+
```

여러 배열 매개변수 예제:
```sql
SELECT array_count((x, y) -> x > y, [1, 2, 3], [0, 3, 2]);
+--------------------------------------------------+
| array_count((x, y) -> x > y, [1, 2, 3], [0, 3, 2]) |
+--------------------------------------------------+
|                                              2   |
+--------------------------------------------------+
```

복합 타입 예제 - 요소가 2개보다 많은 배열의 개수 세기:
```sql
SELECT array_count(x -> array_size(x) > 2, [[1,2],[1,2,3],[4,5,6,7]]);
+----------------------------------------------------------------+
| array_count(x -> array_size(x) > 2, [[1,2],[1,2,3],[4,5,6,7]]) |
+----------------------------------------------------------------+
|                                                              2 |
+----------------------------------------------------------------+
```

중첩된 고차 함수: `array_count`는 람다 본문이 BOOLEAN으로 변환할 수 있는 스칼라 값을 반환해야 합니다. 내부의 `array_exists`가 불리언 값의 ARRAY(내부 요소당 하나)를 반환하면 `array_count`는 이를 처리할 수 없어 시그니처 오류를 보고합니다:

```sql
SELECT array_count(x -> array_exists(y -> y > 5, x), [[1,2,3],[4,5,6],[7,8,9]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_count(ARRAY<ARRAY<BOOLEAN>>)
```

5보다 큰 요소를 *하나라도* 포함하는 외부 배열의 개수를 세려면, 내부 검사식을 감싸 람다가 스칼라 BOOLEAN을 반환하도록 합니다. 예: `size(array_filter(y -> y > 5, x)) > 0`:

```sql
SELECT array_count(x -> size(array_filter(y -> y > 5, x)) > 0, [[1,2,3],[4,5,6],[7,8,9]]);
+----------------------------------------------------------------------------------+
| array_count(x -> size(array_filter(y -> y > 5, x)) > 0, [[1,2,3],[4,5,6],[7,8,9]]) |
+----------------------------------------------------------------------------------+
|                                                                                2 |
+----------------------------------------------------------------------------------+
```

배열 리터럴 예제:
```sql
SELECT array_count(x -> x % 2 = 0, [1, 2, 3, 4, 5, 6]);
+------------------------------------------+
| array_count(x -> x % 2 = 0, [1, 2, 3, 4, 5, 6]) |
+------------------------------------------+
|                                        3 |
+------------------------------------------+
```

### 키워드 {#keywords}

ARRAY, COUNT, ARRAY_COUNT
