---
{
    "title": "NAMED_STRUCT",
    "language": "ko",
    "description": "지정된 필드 이름과 값을 기반으로 struct를 생성하여 반환합니다. 이 함수는 짝수 개의 매개변수를 받으며,"
}
---

## 설명 {#description}

지정된 필드 이름과 값을 기반으로 struct를 생성하여 반환합니다. 이 함수는 짝수 개의 매개변수를 받으며, 홀수 번째 매개변수는 필드 이름이고 짝수 번째 매개변수는 필드 값입니다.

## 구문 {#syntax}

```sql
NAMED_STRUCT( <field_name> , <field_value> [ , <field_name> , <field_value> ... ] )
```

## 매개변수 {#parameters}

- `<field_name>`: struct를 구성하기 위해 홀수 번째 위치에 입력하는 필드 이름으로, 상수 문자열이어야 합니다.
- `<field_value>`: struct를 구성하기 위해 짝수 번째 위치에 입력하는 필드 값으로, 여러 열이나 상수를 사용할 수 있습니다.

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
- 지정된 모든 필드 이름과 값의 쌍을 포함하는 struct를 반환합니다.
- 모든 필드는 NULL 값을 지원합니다.

## 사용법 {#usage}

- 이 함수는 모든 필드 이름과 값의 쌍을 하나의 struct로 결합합니다. 홀수 번째 매개변수는 필드 이름이며, 상수 문자열이어야 하고 대소문자를 구분하지 않으며 중복될 수 없습니다. 짝수 번째 매개변수는 필드 값이며, 여러 열이나 상수를 사용할 수 있습니다.
- 매개변수 개수는 영이 아니면서 1보다 큰 짝수여야 합니다.
- 모든 필드는 nullable로 표시됩니다.

**쿼리 예제:**

기본 사용법:
```sql
select named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing');
+-------------------------------------------------------------+
| named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing') |
+-------------------------------------------------------------+
| {"name":"Alice", "age":25, "city":"Beijing"}                |
+-------------------------------------------------------------+
```

NULL 값을 포함하는 경우:
```sql
select named_struct('id', 1, 'name', null, 'score', 95.5);
+----------------------------------------------------+
| named_struct('id', 1, 'name', null, 'score', 95.5) |
+----------------------------------------------------+
| {"id":1, "name":null, "score":95.5}                |
+----------------------------------------------------+
```

복합 타입을 포함하는 경우:
```sql
select named_struct('array', [1,2,3], 'map', {'key':'value'}, 'struct', named_struct('f1',1,'f2',2));
+-----------------------------------------------------------------------------------------------+
| named_struct('array', [1,2,3], 'map', {'key':'value'}, 'struct', named_struct('f1',1,'f2',2)) |
+-----------------------------------------------------------------------------------------------+
| {"array":[1, 2, 3], "map":{"key":"value"}, "struct":{"f1":1, "f2":2}}                         |
+-----------------------------------------------------------------------------------------------+
```

IP 주소를 포함하는 이름이 지정된 struct 생성:
```sql
select named_struct('ipv4', cast('192.168.1.1' as ipv4), 'ipv6', cast('2001:db8::1' as ipv6));
+----------------------------------------------------------------------------------------+
| named_struct('ipv4', cast('192.168.1.1' as ipv4), 'ipv6', cast('2001:db8::1' as ipv6)) |
+----------------------------------------------------------------------------------------+
| {"ipv4":"192.168.1.1", "ipv6":"2001:db8::1"}                                           |
+----------------------------------------------------------------------------------------+
```

오류 예제

매개변수가 2개 미만인 경우:
```sql
select named_Struct();
ERROR 1105 (HY000): errCode = 2, detailMessage = named_struct requires at least two arguments, like: named_struct('a', 1)

select named_struct('name');
ERROR 1105 (HY000): errCode = 2, detailMessage = named_struct requires at least two arguments, like: named_struct('a', 1)
```

매개변수 개수가 홀수인 경우:
```sql
select named_struct('name', 'Alice', 'age');
ERROR 1105 (HY000): errCode = 2, detailMessage = named_struct can't be odd parameters, need even parameters named_struct('name', 'Alice', 'age')
```

필드 이름이 중복되는 경우. 필드 이름은 대소문자를 구분하지 않습니다:
```sql
select named_struct('name', 'Alice', 'name', 'Bob');
ERROR 1105 (HY000): errCode = 2, detailMessage = The name of the struct field cannot be repeated. same name fields are name

select named_struct('name', 'Alice', 'Name', 'Bob');
ERROR 1105 (HY000): errCode = 2, detailMessage = The name of the struct field cannot be repeated. same name fields are name
```
