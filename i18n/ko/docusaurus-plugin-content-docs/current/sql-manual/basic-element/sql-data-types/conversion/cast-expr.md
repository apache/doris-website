---
{
    "title": "CAST 표현식",
    "language": "ko",
    "description": "CAST는 한 데이터 타입의 값을 다른 데이터 타입으로 변환합니다."
}
---

## 소개 {#introduction}

CAST는 한 데이터 타입의 값을 다른 데이터 타입으로 변환합니다.
TRY_CAST는 변환에 실패하면 오류를 발생시키는 대신 SQL NULL 값을 반환하는 안전한 타입 변환 기능입니다.

## 구문 {#syntax}

```sql
CAST( <source_expr> AS <target_data_type> )
TRY_CAST( <source_expr> AS <target_data_type> )
```

## 인수 {#arguments}

- source_expr  
  다른 데이터 타입으로 변환할 표현식입니다. 지원되는 모든 데이터 타입을 사용할 수 있습니다.
- target_data_type  
  변환할 대상 데이터 타입입니다. 해당 타입이 추가 속성을 지원하는 경우(예: DECIMAL(p, s)의 정밀도와 스케일), 필요에 따라 지정합니다.

## 엄격 모드 {#strict-mode}

Doris 4.0 이전에는 MySQL과 같은 데이터베이스 시스템의 방식을 따라 CAST 연산에서 오류가 발생하지 않도록 처리했습니다. 예를 들어 MySQL에서 다음 SQL을 실행하면:

```sql
select cast('abc' as signed);
```

다음 결과가 반환됩니다:
```
0
```

Doris 4.0부터는 PostgreSQL의 방식을 따라 더 엄격하게 처리합니다. 유효하지 않은 변환이 발생하면 혼란을 줄 수 있는 결과를 생성하는 대신 오류를 바로 보고합니다.

Doris 4.0에는 새로운 변수 `enable_strict_cast`가 도입되었으며, 다음과 같이 활성화할 수 있습니다:

```sql
set enable_strict_cast = true;
```

엄격 모드에서는 유효하지 않은 CAST 연산이 즉시 오류를 발생시킵니다:

```sql
mysql> select cast('abc' as int);
ERROR 1105 (HY000): errCode = 2, detailMessage = abc can't cast to INT in strict mode.
```

엄격 모드의 장점은 다음과 같습니다:
1. CAST 연산 중 사용자가 예상치 못한 값을 받는 것을 방지합니다
2. 유효하지 않은 데이터는 즉시 오류를 발생시키므로, 시스템은 모든 데이터의 타입을 성공적으로 변환할 수 있다고 가정하여 연산을 더 효과적으로 최적화할 수 있습니다

## 예제 {#examples}

### 일반적인 CAST 변환 {#normal-cast-conversion}

```sql
SELECT CAST('123' AS INT);
```

```text
+--------------------+
| cast('123' as int) |
+--------------------+
|                123 |
+--------------------+
```

### TRY_CAST로 실패할 수 있는 변환 처리 {#using-try_cast-to-handle-potentially-failed-conversions}

4.1.5부터는 변환 중 산술 오버플로가 발생해도 TRY_CAST 쿼리 전체가 실패하지 않고 해당 행에 NULL을 반환합니다. 내부 실행 오류나 지원되지 않는 타입 변환이 발생하면 여전히 쿼리가 실패할 수 있습니다. TRY_CAST가 모든 오류를 억제하는 것은 아닙니다.

변환이 실패할 수 있는 경우 TRY_CAST를 사용하면 오류 대신 NULL을 반환하여 쿼리 오류를 방지할 수 있습니다:

```sql
SELECT TRY_CAST('abc' AS INT);
```

```text
+------------------------+
| try_cast('abc' as int) |
+------------------------+
|                   NULL |
+------------------------+
```

## 동작 {#behavior}

CAST는 target_data_type에 따라 다음과 같이 분류합니다:

- [ARRAY로 변환](./array-conversion.md)
- [BOOLEAN으로 변환](./boolean-conversion.md)
- [DATE로 변환](./date-conversion.md)
- [TIME으로 변환](./time-conversion.md)
- [DATETIME으로 변환](./datetime-conversion.md)
- [TIMESTAMP_NS로 변환](./timestamp-ns-conversion.md)
- [TIMESTAMPTZ로 변환](./timestamptz-conversion.md)
- [정수(INT 등)로 변환](./int-conversion.md)
- [부동 소수점(FLOAT/DOUBLE)으로 변환](./float-double-conversion.md)
- [DECIMAL로 변환](./decimal-conversion.md)
- [CHAR/VARCHAR/STRING으로 변환](./cast-to-string.md)
- [JSON으로 변환 / JSON에서 다른 타입으로 변환](./json-conversion.md)
- [MAP으로 변환](./map-conversion.md)
- [STRUCT로 변환](./struct-conversion.md)
- [IP로 변환](./ip-conversion.md)

## 암시적 CAST {#implicit-cast}

일부 함수는 암시적 CAST를 유발할 수 있으며, 이로 인해 특정 상황에서 예상치 못한 동작이 발생할 수 있습니다.
EXPLAIN 문을 사용하면 암시적 CAST가 발생하는지 확인할 수 있습니다:

```sql
EXPLAIN SELECT length(123);
```

```text
...
length(CAST(123 AS varchar(65533)))
...
```

위 실행 계획을 보면 시스템이 자동으로 CAST 변환을 수행하여 정수 123을 문자열 타입으로 변환하는 것을 확인할 수 있습니다. 이것이 암시적 CAST의 예입니다.

산술 오버플로와 NULL 입력:

```sql
SELECT TRY_CAST(CAST(1000 AS DECIMAL(9, 0)) AS DECIMAL(3, 0)) AS overflow_value,
       TRY_CAST(NULL AS INT) AS null_value;
```

```text
+----------------+------------+
| overflow_value | null_value |
+----------------+------------+
| NULL           | NULL       |
+----------------+------------+
```
