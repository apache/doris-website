---
{
    "title": "DATE_TRUNC",
    "language": "ko",
    "description": "DATETRUNC 함수는 날짜 또는 시간 값(datetime)을 지정된 시간 단위(timeunit)로 절삭하는 데 사용됩니다."
}
---

## 설명 {#description}

DATE_TRUNC 함수는 `DATE`, `DATETIME`, `TIMESTAMP_NS` 또는 `TIMESTAMPTZ` 값(`datetime`)을 지정된 시간 단위(`time_unit`)로 절삭합니다. 지정된 단위와 그보다 상위 단위의 시간 정보는 유지하고, 하위 단위의 시간 정보는 날짜 및 시간의 최솟값으로 초기화합니다. 예를 들어 "hour" 단위로 절삭하면 연도, 월, 일, 시는 유지되고 분, 초 등은 영으로 초기화됩니다. 연도 단위로 절삭하면 일과 월이 절삭되어 xxxx-01-01이 됩니다.

## 구문 {#syntax}

```sql
DATE_TRUNC(<datetime>, <time_unit>)
DATE_TRUNC(<time_unit>, <datetime>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<datetime>` | 유효한 날짜 표현식입니다. `DATE`, `DATETIME`, `TIMESTAMP_NS`, `TIMESTAMPTZ`를 지원합니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참고하세요. |
| `<time_unit>` | 절삭할 시간 단위입니다. 사용 가능한 값은 [`second`,`minute`,`hour`,`day`,`week`,`month`,`quarter`,`year`]입니다. 시간 단위는 문자열 상수여야 하며, 컬럼이나 상수가 아닌 표현식은 사용할 수 없습니다. |

## 반환값 {#return-value}

`TIMESTAMP_NS` 입력은 소수 초 정밀도가 아홉 자리로 고정된 `TIMESTAMP_NS`를 반환합니다. 결과가 반환 타입의 범위 안에 있는지 검증합니다. `TIMESTAMP_NS`의 범위는 `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]`입니다.

절삭 결과를 datetime과 같은 타입으로 반환합니다:
- 입력이 DATE이면 DATE를 반환합니다.
- 입력이 DATETIME이거나 시간을 포함한 문자열이면 DATETIME을 반환합니다(날짜와 절삭된 시간 포함).
- 입력이 TIMESTAMP_NS이면 소수 초가 아홉 자리인 TIMESTAMP_NS를 반환합니다.
- 입력이 TIMESTAMPTZ 타입이면 먼저 local_time으로 변환한 후(예를 들어 세션 변수 값이 `+08:00`인 경우, `2025-12-31 23:59:59+05:00`이 나타내는 local_time은 `2026-01-01 02:59:59`입니다) 절삭 연산을 수행합니다.
- scale이 있는 datetime 타입은 소수 부분이 영으로 절삭되지만 반환값의 scale은 유지됩니다.

특수한 경우:
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- time_unit이 지원되지 않으면 오류를 반환합니다.

## 예제 {#examples}

```sql
-- Truncate by second, minute, hour, day, week, month, quarter, year
mysql> select date_trunc(cast('2010-12-02 19:28:30' as datetime), 'second');

+---------------------------------------------------------------+
| date_trunc(cast('2010-12-02 19:28:30' as datetime), 'second') |
+---------------------------------------------------------------+
| 2010-12-02 19:28:30                                           |
+---------------------------------------------------------------+

select date_trunc('2010-12-02 19:28:30', 'minute');

+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'minute')     |
+-------------------------------------------------+
| 2010-12-02 19:28:00                             |
+-------------------------------------------------+

select date_trunc('2010-12-02 19:28:30', 'hour');

+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'hour')       |
+-------------------------------------------------+
| 2010-12-02 19:00:00                             |
+-------------------------------------------------+

select date_trunc('2010-12-02 19:28:30', 'day');

+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'day')        |
+-------------------------------------------------+
| 2010-12-02 00:00:00                             |
+-------------------------------------------------+

select date_trunc('2023-4-05 19:28:30', 'week');

+-------------------------------------------+
| date_trunc('2023-04-05 19:28:30', 'week') |
+-------------------------------------------+
| 2023-04-03 00:00:00                       |
+-------------------------------------------+

select date_trunc(cast('2010-12-02' as date), 'month');
+-------------------------------------------------+
| date_trunc(cast('2010-12-02' as date), 'month') |
+-------------------------------------------------+
| 2010-12-01                                      |
+-------------------------------------------------+

select date_trunc('2010-12-02 19:28:30', 'quarter');

+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'quarter')    |
+-------------------------------------------------+
| 2010-10-01 00:00:00                             |
+-------------------------------------------------+

select date_trunc('2010-12-02 19:28:30', 'year');

+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'year')       |
+-------------------------------------------------+
| 2010-01-01 00:00:00                             |
+-------------------------------------------------+

-- For datetime with scale, fractional digits will be truncated to zero without rounding, but return value retains scale
mysql> select date_trunc('2010-12-02 19:28:30.523', 'second');
+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30.523', 'second') |
+-------------------------------------------------+
| 2010-12-02 19:28:30.000                         |
+-------------------------------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
-- Convert the variable value to local_time(2026-01-01 02:59:59) before truncation
SELECT DATE_TRUNC('2025-12-31 23:59:59+05:00', 'year');
+-------------------------------------------------+
| DATE_TRUNC('2025-12-31 23:59:59+05:00', 'year') |
+-------------------------------------------------+
| 2026-01-01 00:00:00+08:00                       |
+-------------------------------------------------+

-- Unsupported unit, returns error
select date_trunc('2010-12-02 19:28:30', 'quar');
ERROR 1105 (HY000): errCode = 2, detailMessage = date_trunc function time unit param only support argument is year|quarter|month|week|day|hour|minute|second
```
