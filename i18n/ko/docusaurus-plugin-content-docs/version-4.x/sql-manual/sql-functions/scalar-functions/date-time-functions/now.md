---
{
    "title": "NOW",
    "language": "ko",
    "description": "NOW 함수는 현재 시스템 날짜와 시간을 가져오는 데 사용되며, DATETIME 타입의 값을 반환합니다."
}
---

## 설명 {#description}

`NOW` 함수는 현재 시스템 날짜와 시간을 가져오는 데 사용되며, `DATETIME` 타입의 값을 반환합니다. 선택적 매개변수로 소수 초의 정밀도를 지정하여 반환 결과의 마이크로초 자릿수를 조정할 수 있습니다.

이 함수는 MySQL의 [now 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_now)와 동일하게 동작합니다.

# 별칭 {#alias}
- current_timestamp()

## 구문 {#syntax}

```sql
NOW([`<precision>`])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<precision>` | 반환 값의 소수 초 부분의 정밀도를 나타내는 선택적 매개변수로, 범위는 0부터 6까지입니다. 기본값은 0이며, 소수 초를 반환하지 않음을 의미합니다. `<br/>`JDK 구현상의 제약으로 인해 JDK8로 FE를 빌드하면 밀리초(소수점 이하 세 자리)까지만 정밀도가 지원되며, 그보다 높은 정밀도의 자릿수는 영으로 채워집니다. 더 높은 정밀도가 필요한 경우 JDK11을 사용하세요. |

## 반환 값 {#return-value}

현재 시스템 시간을 `DATETIME` 타입으로 반환합니다.
- 지정한 `<precision>`이 범위를 벗어나면(예: 음수이거나 6보다 큰 경우) 함수가 오류를 반환합니다.

## 예제 {#examples}

```sql
---Get current time
select NOW(),NOW(3),NOW(6);
+---------------------+-------------------------+----------------------------+
| now()               | now(3)                  | now(6)                     |
+---------------------+-------------------------+----------------------------+
| 2025-01-23 11:08:35 | 2025-01-23 11:08:35.561 | 2025-01-23 11:08:35.562000 |
+---------------------+-------------------------+----------------------------+

--- Invalid precision (out of range, error)
SELECT NOW(7) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = Invalid precision for NOW function. Precision must be between 0 and 6.

select NOW(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Scale of Datetime/Time must between 0 and 6. Scale was set to: -1
```
