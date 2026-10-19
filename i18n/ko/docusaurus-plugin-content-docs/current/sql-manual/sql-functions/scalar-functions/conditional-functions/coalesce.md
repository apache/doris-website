---
{
    "title": "COALESCE",
    "language": "ko",
    "description": "인수 목록을 왼쪽에서 오른쪽으로 평가하여 NULL이 아닌 첫 번째 표현식을 반환합니다. 모든 인수가 NULL이면 NULL을 반환합니다."
}
---

## 설명 {#description}

인수 목록을 왼쪽에서 오른쪽으로 평가하여 NULL이 아닌 첫 번째 표현식을 반환합니다. 모든 인수가 NULL이면 NULL을 반환합니다.

## 구문 {#syntax}

```sql
COALESCE( <expr1> [ , ... , <exprN> ] )
```

## 매개변수 {#parameters}
### 필수 매개변수 {#required-parameter}
- `<expr1>`: 모든 타입의 표현식을 사용할 수 있습니다.
### 가변 매개변수 {#variadic-parameters}
- `COALESCE` 함수는 여러 개의 가변 매개변수를 지원합니다.

## 반환 값 {#return-value}
인수 목록에서 NULL이 아닌 첫 번째 표현식을 반환합니다. 모든 인수가 NULL이면 NULL을 반환합니다.

## 사용 시 참고 사항 {#usage-notes}
1. 여러 인수의 타입은 가능한 한 일치시키는 것이 좋습니다.
2. 여러 인수의 타입이 일치하지 않으면 함수는 인수를 동일한 타입으로 변환하려고 시도합니다. 변환 규칙은 [타입 변환](../../../basic-element/sql-data-types/conversion/overview.md)을 참조하세요.
3. 현재 인수로 다음 타입만 지원합니다:
    * 문자열 타입 (String/VARCHAR/CHAR)
    * 불리언 타입 (Boolean)
    * 숫자 타입 (TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal)
    * 날짜 타입 (Date, DateTime, TimestampNs)
    * 비트맵 타입 (Bitmap)
    * 반정형 타입 (JSON, Array, MAP, Struct)

## 예제 {#examples}
1. 인수 타입 변환
    ```sql
    select coalesce(null, 2, 1.234);
    ```
    ```text
    +--------------------------+
    | coalesce(null, 2, 1.234) |
    +--------------------------+
    |                    2.000 |
    +--------------------------+
    ```
    > 세 번째 인수 "1.234"가 Decimal 타입이므로 인수 "2"는 Decimal 타입으로 변환됩니다.

2. 모든 인수가 NULL인 경우
    ```sql
    select coalesce(null, null, null);
    ```
    ```text
    +----------------------------+
    | coalesce(null, null, null) |
    +----------------------------+
    | NULL                       |
    +----------------------------+
    ```
