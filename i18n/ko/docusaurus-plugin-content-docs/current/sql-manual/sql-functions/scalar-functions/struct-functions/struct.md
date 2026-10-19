---
{
    "title": "STRUCT | Struct 함수",
    "language": "ko",
    "description": "주어진 값을 기반으로 struct를 생성하여 반환합니다. 이 함수는 하나 이상의 매개변수를 받아 모든 입력 요소가 포함된 struct를 반환합니다.",
    "sidebar_label": "STRUCT"
}
---

# STRUCT {#struct}

## 설명 {#description}

주어진 값을 기반으로 struct를 생성하여 반환합니다. 이 함수는 하나 이상의 매개변수를 받아 모든 입력 요소가 포함된 struct를 반환합니다.

## 구문 {#syntax}

```sql
STRUCT( <expr1> [ , <expr2> ... ] )
```

## 매개변수 {#parameters}

- `<expr1>, <expr2>, ...`: struct를 생성하는 데 사용할 입력 값으로, 하나 이상의 매개변수를 지원합니다.

**지원되는 요소 타입:**
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 문자열 타입: CHAR, VARCHAR, STRING
- 날짜 및 시간 타입: DATE, DATETIME, DATEV2, DATETIMEV2
- 불리언 타입: BOOLEAN
- IP 타입: IPV4, IPV6
- 복합 타입: ARRAY, MAP, STRUCT

## 반환 값 {#return-value}

반환 타입: STRUCT<T>

반환 값의 의미:
- 모든 입력 요소가 포함된 struct를 반환하며, 필드 이름은 기본적으로 col1, col2, col3, ... 형식입니다.
- 모든 필드는 NULL 값을 지원합니다.

## 사용법 {#usage}

- 이 함수는 모든 입력 요소를 하나의 struct로 결합합니다.
- 매개변수가 하나 이상 필요합니다.
- 모든 필드는 nullable로 표시됩니다.

## 예제 {#examples}

**쿼리 예제:**

기본 사용법: 여러 타입의 값과 NULL 필드가 포함된 struct 생성
```sql
select struct(1, 'a', "abc"),struct(null, 1, null),struct(cast('2023-03-16' as datetime));
+--------------------------------------+--------------------------------------+----------------------------------------+
| struct(1, 'a', "abc")                | struct(null, 1, null)                | struct(cast('2023-03-16' as datetime)) |
+--------------------------------------+--------------------------------------+----------------------------------------+
| {"col1":1, "col2":"a", "col3":"abc"} | {"col1":null, "col2":1, "col3":null} | {"col1":"2023-03-16 00:00:00"}         |
+--------------------------------------+--------------------------------------+----------------------------------------+
```

복합 타입이 포함된 struct 생성:
```sql
select struct([1,2,3], {'name':'Alice','age':20}, named_struct('f1',1,'f2',2));
+----------------------------------------------------------------------------------+
| struct([1,2,3], {'name':'Alice','age':20}, named_struct('f1',1,'f2',2))          |
+----------------------------------------------------------------------------------+
| {"col1":[1, 2, 3], "col2":{"name":"Alice", "age":"20"}, "col3":{"f1":1, "f2":2}} |
+----------------------------------------------------------------------------------+
```

IP 주소가 포함된 struct 생성:
```sql
select struct(cast('192.168.1.1' as ipv4), cast('2001:db8::1' as ipv6));
+------------------------------------------------------------------+
| struct(cast('192.168.1.1' as ipv4), cast('2001:db8::1' as ipv6)) |
+------------------------------------------------------------------+
| {"col1":"192.168.1.1", "col2":"2001:db8::1"}                     |
+------------------------------------------------------------------+
```

오류 예제

지원되지 않는 타입을 사용하면 오류가 발생합니다:
Json/Variant 타입이 포함된 struct 생성
```sql 
select struct(v) from var_with_index;
ERROR 1105 (HY000): errCode = 2, detailMessage = struct does not support jsonb/variant type

select struct(cast(1 as jsonb)) from var_with_index;
ERROR 1105 (HY000): errCode = 2, detailMessage = struct does not support jsonb/variant type
```

빈 struct를 생성하면 오류가 발생합니다. hive의 동작과 동일하게 매개변수가 하나 이상 필요합니다:
```sql
select struct();
ERROR 1105 (HY000): errCode = 2, detailMessage = struct requires at least one argument, like: struct(1)
```
