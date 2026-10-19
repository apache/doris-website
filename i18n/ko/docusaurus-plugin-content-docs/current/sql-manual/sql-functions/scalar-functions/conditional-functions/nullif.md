---
{
    "title": "NULLIF",
    "language": "ko",
    "description": "두 입력값이 같으면 NULL을 반환하고, 그렇지 않으면 첫 번째 입력값을 반환합니다."
}
---

## 설명 {#description}

두 입력값이 같으면 `NULL`을 반환하고, 그렇지 않으면 첫 번째 입력값을 반환합니다. 이 함수는 다음 `CASE WHEN` 표현식과 동일합니다.

```sql
CASE
    WHEN <expr1> = <expr2> THEN NULL
    ELSE <expr1>
END
```

## 구문 {#syntax}

```sql
NULLIF(<expr1>, <expr2>)
```

## 매개변수 {#parameters}
- `<expr1>`: 비교할 첫 번째 입력값입니다. 지원되는 타입은 아래 사용 시 참고 사항을 참조하세요.
- `<expr2>`: 첫 번째 입력값과 비교할 두 번째 값입니다. 지원되는 타입은 아래 사용 시 참고 사항을 참조하세요.

## 사용 시 참고 사항 {#usage-notes}
매개변수에 지원되는 타입은 다음과 같습니다.
1. Boolean
2. 숫자 타입 (TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal)
3. 날짜 타입 (Date, DateTime, TimestampNs, Time)
4. 문자열 타입 (String, VARCHAR, CHAR)

## 반환값 {#return-value}
- `<expr1>`이 `<expr2>`와 같으면 `NULL`을 반환합니다.
- 그렇지 않으면 `<expr1>`의 값을 반환합니다.

## 예제 {#examples}
1. 예제 1
    ```sql
    SELECT NULLIF(1, 1);
    ```
    ```text
    +--------------+
    | NULLIF(1, 1) |
    +--------------+
    |         NULL |
    +--------------+
    ```
2. 예제 2
    ```sql
    SELECT NULLIF(1, 0);
    ```
    ```text
    +--------------+
    | NULLIF(1, 0) |
    +--------------+
    |            1 |
    +--------------+
    ```
