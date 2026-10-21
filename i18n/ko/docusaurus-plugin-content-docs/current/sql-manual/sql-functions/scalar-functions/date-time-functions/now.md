---
{
    "title": "NOW",
    "language": "ko",
    "description": "NOW 함수는 현재 시스템 날짜와 시간을 반환하며, 선택적으로 0부터 9까지의 정밀도를 지정할 수 있습니다."
}
---

## 설명 {#description}

`NOW` 함수는 현재 시스템 날짜와 시간을 반환합니다. 초의 소수부 정밀도를 0부터 9까지 지정할 수 있는 선택적 매개변수를 지원합니다.

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
| `<precision>` | `[0, 9]` 범위의 선택적 정수 상수입니다. 기본값은 0입니다. 0부터 6까지의 값은 해당 정밀도의 `DATETIME(p)`를 반환하며, 7부터 9까지의 값은 `TIMESTAMP_NS`를 반환합니다. 실제 클록 해상도는 운영 체제와 JDK에 따라 달라지므로, 지원되지 않는 하위 자릿수는 영으로 채워집니다. |

## 반환 값 {#return-value}

현재 시스템 시간을 반환합니다. `<precision>`이 0부터 6까지이면 반환 타입은 `DATETIME(<precision>)`입니다. `<precision>`이 7부터 9까지이면 반환 타입은 `TIMESTAMP_NS`이며, 소수점 이하 아홉 자리까지 표시됩니다. 하나의 문 내에서는 값이 일정하게 유지됩니다.

- `<precision>`이 음수이거나 9보다 크면 함수는 오류를 반환합니다.

## 예제 {#examples}

```sql
---Get current time
select NOW(), NOW(3), NOW(6), NOW(9);
+---------------------+-------------------------+----------------------------+-------------------------------+
| now()               | now(3)                  | now(6)                     | now(9)                        |
+---------------------+-------------------------+----------------------------+-------------------------------+
| 2025-01-23 11:08:35 | 2025-01-23 11:08:35.561 | 2025-01-23 11:08:35.561000 | 2025-01-23 11:08:35.561000000 |
+---------------------+-------------------------+----------------------------+-------------------------------+

--- Invalid precision (out of range, error)
SELECT NOW(10) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = Precision of NOW must be between 0 and 9. Precision was set to: 10

select NOW(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Precision of NOW must be between 0 and 9. Precision was set to: -1
```
