---
{
    "title": "WEEK_FLOOR",
    "language": "ko",
    "description": "WEEKFLOOR 함수는 입력 datetime 값을 지정한 주 간격에 따라 가장 가까운 구간 시작 시각으로 내림합니다. 간격 단위는 WEEK입니다."
}
---

## 설명 {#description}

WEEK_FLOOR 함수는 입력 datetime 값을 지정한 주 간격에 따라 가장 가까운 구간 시작 시각으로 내림합니다. 간격 단위는 WEEK입니다. 시작 기준점(origin)을 지정하면 해당 지점을 기준으로 간격을 계산합니다. 지정하지 않으면 기본적으로 0001-01-01 00:00:00을 기준점으로 사용합니다.

날짜 계산 공식:
$$
\text{WEEK\_FLOOR}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{WEEK} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{WEEK} \leq \langle\text{date\_or\_time\_expr}\rangle\}
$$
$k$는 기준 시각에서 대상 시각까지의 구간 수를 나타냅니다.

## 구문 {#syntax}

```sql
WEEK_FLOOR(<date_or_time_expr>)
WEEK_FLOOR(<date_or_time_expr>, <origin>)
WEEK_FLOOR(<date_or_time_expr>, <period>)
WEEK_FLOOR(<date_or_time_expr>, <period>, <origin>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_time_expr>` | 내림할 datetime 값으로, date/datetime/timestamptz 타입을 지원합니다. date 타입은 해당 날짜의 시작 시각인 00:00:00으로 변환됩니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)을 참조하고, datetime/date 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요.|
| `<period>` | 주 간격 값으로, 타입은 INT이며 각 구간에 포함되는 주 수를 나타냅니다. |
| `<origin>` | 구간의 시작점으로, date/datetime 타입을 지원합니다. 기본값은 0001-01-01 00:00:00입니다. |

## 반환값 {#return-value}

내림한 datetime 값을 나타내는 TIMESTAMPTZ, DATETIME 또는 DATE를 반환합니다. 시각 부분은 origin에 따라 결정됩니다.

- 입력값이 NULL이 아니고 `<period>`가 양수가 아닌 경우(≤0), 함수는 오류를 반환합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- `<datetime>`이 구간 시작점에 정확히 일치하면(`<period>`와 `<origin>` 기준), 해당 시작점을 반환합니다.
- 입력값이 date 타입이면 date 타입을 반환합니다.
- 입력값이 datetime 타입이면 origin의 시각 부분과 동일한 시각 부분을 갖는 datetime 타입을 반환합니다.
- `<origin>`의 날짜와 시각이 `<date_or_time_expr>`보다 나중이어도 위 공식에 따라 계산하지만, 구간 수 k는 음수가 됩니다.
- `date_or_time_expr`에 scale이 있으면 결과도 해당 정밀도를 유지합니다. `origin`에 초의 소수 부분이 포함되어 있으면 구간 경계도 해당 소수 부분을 유지합니다. Doris 4.1 시리즈의 4.1.5부터는 주 경계 비교에 마이크로초를 반영하여 입력값과 `origin`이 초의 소수 부분에서만 다른 경우의 내림 결과를 바로잡습니다.
- 입력값이 TIMESTAMPTZ 타입이면 먼저 local_time으로 변환한 뒤(예: `2025-12-31 23:59:59+05:00`의 local_time은 `2026-01-01 02:59:59`이며, 이는 세션 변수가 `+08:00`인 경우입니다), FLOOR 연산을 수행합니다.
- 입력 시각 값(`<date_or_time_expr>`와 `<origin>`)에 TIMESTAMPTZ와 DATETIME 타입이 모두 포함되어 있으면 출력은 DATETIME 타입입니다.

<a id="examples"></a>

## 예제 {#example}

```sql
-- 2023-07-13 is Thursday, default 1-week interval (starting Monday), rounds down to nearest Monday (2023-07-10)
SELECT WEEK_FLOOR(cast('2023-07-13 22:28:18' as datetime)) AS result;
```

```text
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+
```

```sql
-- Specify 2-week interval, rounds down to nearest 2-week interval start
SELECT WEEK_FLOOR('2023-07-13 22:28:18', 2) AS result;
```

```text
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+
```

```sql
-- input with decimal part
SELECT WEEK_FLOOR('2023-07-13 22:28:18.123', 2) AS result;
```

```text
+-------------------------+
| result                  |
+-------------------------+
| 2023-07-10 00:00:00.000 |
+-------------------------+
```

```sql
-- Input date type, returns date type
SELECT WEEK_FLOOR(cast('2023-07-13' as date)) AS result;
```

```text
+------------+
| result     |
+------------+
| 2023-07-10 |
+------------+
```

```sql
-- Only with origin date and specified date
select week_floor("2023-07-13 22:28:18", "2021-05-01 12:00:00");
```

```text
+----------------------------------------------------------+
| week_floor("2023-07-13 22:28:18", "2021-05-01 12:00:00") |
+----------------------------------------------------------+
| 2023-07-08 12:00:00                                      |
+----------------------------------------------------------+
```

```sql
-- Specify origin='2023-07-03' (Monday), 1-week interval
SELECT WEEK_FLOOR('2023-07-13', 1, '2023-07-03') AS result;
```

```text
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+
```

```sql
-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform WEEK_FLOOR
SELECT WEEK_FLOOR('2025-12-31 23:59:59+05:00');
```

```text
+-----------------------------------------+
| WEEK_FLOOR('2025-12-31 23:59:59+05:00') |
+-----------------------------------------+
| 2025-12-29 00:00:00+08:00               |
+-----------------------------------------+
```

```sql
-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT WEEK_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
```

```text
+--------------------------------------------------------------------+
| WEEK_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+--------------------------------------------------------------------+
| 2025-12-29 00:00:00.123                                            |
+--------------------------------------------------------------------+
```

```sql
-- Invalid period, returns error
SELECT WEEK_FLOOR('2023-07-13', 0) AS result;
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation week_floor of 2023-07-13 00:00:00, 0 out of range
```

```sql
-- Parameter is NULL
SELECT WEEK_FLOOR(NULL, 1) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```

입력값이 구간 경계에 정확히 일치하면 그대로 반환됩니다.

```sql
SELECT WEEK_FLOOR('2023-07-10 00:00:00', 2);
```

```text
2023-07-10 00:00:00
```

마이크로초 정밀도의 origin을 사용한 주 경계(Doris 4.1 시리즈의 4.1.5부터 수정됨):

```sql
SELECT WEEK_FLOOR(CAST('2024-01-08 00:00:00.400000' AS DATETIME(6)),
                   1, CAST('2024-01-01 00:00:00.500000' AS DATETIME(6)));
```

```text
2024-01-01 00:00:00.500000
```
