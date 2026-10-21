---
{
    "title": "STRUCT_ELEMENT",
    "language": "ko",
    "description": "struct 데이터 컬럼 내의 특정 필드를 반환합니다. 이 함수는 필드 위치(인덱스) 또는 필드 이름을 통해 struct의 필드에 접근할 수 있도록 지원합니다."
}
---

:::caution
다른 데이터베이스나 쿼리 엔진에서는 이와 같은 함수를 제공하지 않으므로 `STRUCT_ELEMENT`는 4.1.3 버전부터 제거되었습니다. 대신 [`ELEMENT_AT`](../variant-functions/element-at.md) 함수를 사용하세요(또는 이와 동등한 첨자 `s[k]` / `s['field_name']` 및 점 표기법 `s.field_name` 구문을 사용하세요).
:::

## 설명 {#description}

struct 데이터 컬럼 내의 특정 필드를 반환합니다. 이 함수는 필드 위치(인덱스) 또는 필드 이름을 통해 struct의 필드에 접근할 수 있도록 지원합니다.

## 구문 {#syntax}

```sql
STRUCT_ELEMENT( <struct>, <field_location_or_name> )
```

## 매개변수 {#parameters}

- `<struct>`: 입력 struct 컬럼
- `<field_location_or_name>`: 필드 위치(1부터 시작) 또는 필드 이름. 상수만 지원합니다.

## 반환 값 {#return-value}

반환 타입: struct에서 지원하는 필드 값의 타입

반환 값의 의미:
- 지정한 필드 값을 반환합니다.
- 입력 struct가 null이면 null을 반환합니다.
- 지정한 필드가 없으면 오류가 발생합니다.

## 사용법 {#usage}

- 필드 위치(인덱스)를 통한 접근을 지원하며, 인덱스는 1부터 시작합니다.
- 필드 이름을 통한 접근을 지원하며, 필드 이름은 **대소문자를 구분하지 않고** 일치 여부를 확인합니다.
- 두 번째 매개변수는 상수여야 합니다(컬럼은 사용할 수 없습니다).
- 이 함수는 AlwaysNullable로 표시되어 있으며, 반환 값은 null일 수 있습니다.
- 4.1.3 버전부터 `STRUCT_ELEMENT`가 제거되었습니다. 대신 `ELEMENT_AT(<struct>, ...)`, 첨자 연산자 `<struct>[<index>]` / `<struct>['<field_name>']` 또는 점 연산자 `<struct_col>.<field_name>`를 사용하세요. 모두 struct 필드에 접근하는 동등한 방법입니다.

## 예제 {#examples}

**쿼리 예제:**

위치로 접근:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 1);
+--------------------------------------------------------------------------------+
| struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 1) |
+--------------------------------------------------------------------------------+
| Alice                                                                          |
+--------------------------------------------------------------------------------+
```

필드 이름으로 접근:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 'age');
+------------------------------------------------------------------------------------+
| struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 'age') |
+------------------------------------------------------------------------------------+
|                                                                                 25 |
+------------------------------------------------------------------------------------+
```

첨자 연산자로 접근(위의 호출과 동등):
```sql
select named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing')[1] as by_index,
       named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing')['age'] as by_name;
+----------+---------+
| by_index | by_name |
+----------+---------+
| Alice    |      25 |
+----------+---------+
```

복합 타입을 포함하는 struct에 접근:
```sql
select struct_element(named_struct('array', [1,2,3], 'map', {'key':'value'}), 'array');
+---------------------------------------------------------------------------------+
| struct_element(named_struct('array', [1,2,3], 'map', {'key':'value'}), 'array') |
+---------------------------------------------------------------------------------+
| [1, 2, 3]                                                                       |
+---------------------------------------------------------------------------------+
```

필드 값이 null인 경우의 접근 결과:
```sql
select struct_element(named_struct('name', null, 'age', 25), 'name');
+---------------------------------------------------------------+
| struct_element(named_struct('name', null, 'age', 25), 'name') |
+---------------------------------------------------------------+
| NULL                                                          |
+---------------------------------------------------------------+
```

오류 예제

존재하지 않는 필드 이름으로 접근:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), 'nonexistent');
ERROR 1105 (HY000): errCode = 2, detailMessage = the specified field name nonexistent was not found: struct_element(named_struct('name', 'Alice', 'age', 25), 'nonexistent')
```

범위를 벗어난 인덱스로 접근:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = the specified field index out of bound: struct_element(named_struct('name', 'Alice', 'age', 25), 5)
```

두 번째 매개변수가 상수가 아닌 경우:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), inv) from var_with_index where k = 4;
ERROR 1105 (HY000): errCode = 2, detailMessage = element_at over a struct only allows a constant int or string second parameter: element_at(named_struct('name', 'Alice', 'age', 25), inv)
```

입력 struct가 NULL인 경우 오류 발생:
```sql
select struct_element(NULL, 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: struct_element(NULL, TINYINT)
```
