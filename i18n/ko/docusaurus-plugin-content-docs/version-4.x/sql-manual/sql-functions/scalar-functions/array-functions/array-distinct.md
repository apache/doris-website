---
{
    "title": "ARRAY_DISTINCT",
    "language": "ko",
    "description": "배열에서 중복 요소를 제거하고 고유한 요소로 구성된 새 배열을 반환합니다. 이 함수는 요소의 원래 순서를 유지합니다."
}
---

## array_distinct {#array_distinct}

<version since="2.0.0">

</version>

## 설명 {#description}

배열에서 중복 요소를 제거하고 고유한 요소로 구성된 새 배열을 반환합니다. 각 요소가 처음 나타나는 위치의 값만 남겨 요소의 원래 순서를 유지합니다.

## 구문 {#syntax}

```sql
array_distinct(ARRAY<T> arr)
```

### 매개변수 {#parameters}

- `arr`：ARRAY\<T> 타입으로, 중복을 제거할 배열입니다. 컬럼 이름이나 상수 값을 사용할 수 있습니다.

**지원되는 T 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6

### 반환 값 {#return-value}

반환 타입: ARRAY\<T>

반환 값의 의미:
- 원본 배열의 모든 고유한 요소를 포함하는 중복 제거된 배열
- 요소의 원래 순서 유지
- NULL: 입력 배열이 NULL인 경우

사용 시 참고 사항:
- 배열을 왼쪽에서 오른쪽으로 순회하며 각 요소가 처음 나타나는 위치의 값만 남기고 이후에 나타나는 중복 요소를 제거합니다.
- 빈 배열은 빈 배열을 반환하고, NULL 배열은 NULL을 반환합니다.
- 중복을 제거할 때 원본 배열에 있는 요소의 상대적인 순서를 유지하며, 순서를 재정렬하지 않습니다.
- 배열 요소에 null이 포함된 경우, null 요소도 중복 제거 대상이며 여러 개의 null 중 하나만 남깁니다.

### 예제 {#examples}

**쿼리 예제:**

정수 배열의 중복 제거: 원본 배열 [1, 2, 3, 4, 5]에는 중복 요소가 없으므로 중복 제거 결과가 원본 배열과 같습니다.
```sql
SELECT array_distinct([1, 2, 3, 4, 5]);
+---------------------------------+
| array_distinct([1, 2, 3, 4, 5]) |
+---------------------------------+
| [1, 2, 3, 4, 5]                 |
+---------------------------------+
```

문자열 배열의 중복 제거: 중복된 문자열 요소를 제거합니다. 원본 배열 ['a', 'b', 'a', 'c', 'b', 'd']에서 'a'와 'b'는 각각 두 번 나타나며, 각각 처음 나타나는 값만 남깁니다. 중복 제거 결과는 ["a", "b", "c", "d"]입니다.
```sql
SELECT array_distinct(['a', 'b', 'a', 'c', 'b', 'd']);
+------------------------------------------------+
| array_distinct(['a', 'b', 'a', 'c', 'b', 'd']) |
+------------------------------------------------+
| ["a", "b", "c", "d"]                           |
+------------------------------------------------+
```

null 값을 포함하는 배열: null 요소도 중복 제거 대상이며, 여러 개의 null 중 하나만 남깁니다. 원본 배열 [1, null, 2, null, 3, null]에서는 null이 세 번 나타나지만, 중복 제거 후에는 첫 번째 null만 남아 결과가 [1, null, 2, 3]이 됩니다.
```sql
SELECT array_distinct([1, null, 2, null, 3, null]);
+---------------------------------------------+
| array_distinct([1, null, 2, null, 3, null]) |
+---------------------------------------------+
| [1, null, 2, 3]                             |
+---------------------------------------------+
```

IP 타입 배열의 중복 제거: IPv4 주소 배열에서 중복을 제거합니다. 원본 배열 ['192.168.1.1', '192.168.1.2', '192.168.1.1']에서 '192.168.1.1'은 두 번 나타납니다. 중복 제거 후에는 해당 주소가 처음 나타나는 위치의 값만 남아 결과가 [192.168.1.1, 192.168.1.2]가 됩니다.
```sql
SELECT array_distinct(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>));
+------------------------------------------------------------------------------------+
| array_distinct(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>)) |
+------------------------------------------------------------------------------------+
| ["192.168.1.1", "192.168.1.2"]                                                     |
+------------------------------------------------------------------------------------+
```

IPv6 타입 배열의 중복 제거: IPv6 주소 배열에서 중복을 제거합니다. 원본 배열 ['2001:db8::1', '2001:db8::2', '2001:db8::1']에서 '2001:db8::1'은 두 번 나타납니다. 중복 제거 후에는 해당 주소가 처음 나타나는 위치의 값만 남아 결과가 [2001:db8::1, 2001:db8::2]가 됩니다.
```sql
SELECT array_distinct(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>));
+------------------------------------------------------------------------------------+
| array_distinct(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>)) |
+------------------------------------------------------------------------------------+
| ["2001:db8::1", "2001:db8::2"]                                                     |
+------------------------------------------------------------------------------------+
```

빈 배열은 빈 배열을 반환합니다. 빈 배열에는 중복을 제거할 요소가 없으므로 그대로 빈 배열을 반환합니다.
```sql
SELECT array_distinct([]);
+--------------------+
| array_distinct([]) |
+--------------------+
| []                 |
+--------------------+
```

NULL 배열은 NULL을 반환합니다. 입력 배열이 NULL이면 오류를 발생시키지 않고 NULL을 반환합니다.
```sql
SELECT array_distinct(NULL);
+----------------------+
| array_distinct(NULL) |
+----------------------+
| NULL                 |
+----------------------+
```

요소가 하나인 배열은 원본 배열을 반환합니다. 요소가 하나뿐인 배열에는 중복 요소가 없으므로 중복 제거 결과가 원본 배열과 같습니다.
```sql
SELECT array_distinct([42]);
+----------------------+
| array_distinct([42]) |
+----------------------+
| [42]                 |
+----------------------+
```

지원되지 않는 복합 타입:

중첩 배열 타입은 지원되지 않으며 오류가 발생합니다.
```sql
SELECT array_distinct([[1,2,3], [4,5,6], [1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_distinct(Array(Nullable(Array(Nullable(TINYINT)))))
```

Map 타입은 지원되지 않으며 오류가 발생합니다.
```sql
SELECT array_distinct([{'a':1}, {'b':2}, {'a':1}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_distinct(Array(Nullable(Map(Nullable(String), Nullable(TINYINT)))))
```

Struct 타입은 지원되지 않으며 오류가 발생합니다.
```sql
SELECT array_distinct(array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30), named_struct('name','Alice','age',20)));
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_distinct(Array(Nullable(Struct(name:Nullable(String), age:Nullable(TINYINT)))))
```

매개변수 개수가 올바르지 않으면 오류가 발생합니다. array_distinct 함수는 배열 매개변수를 하나만 받으므로 여러 매개변수를 전달하면 오류가 발생합니다.
```sql
SELECT array_distinct([1, 2, 3], [4, 5, 6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_distinct' which has 2 arity. Candidate functions are: [array_distinct(Expression)]
```

배열이 아닌 타입을 전달하면 오류가 발생합니다. array_distinct 함수는 배열 타입 매개변수만 받으므로 문자열처럼 배열이 아닌 타입을 전달하면 오류가 발생합니다.
```sql
SELECT array_distinct('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_distinct(VARCHAR(12))
```

### 키워드 {#keywords}

ARRAY, DISTINCT, ARRAY_DISTINCT
