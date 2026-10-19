---
{
    "title": "MONTH_CEIL",
    "language": "ko",
    "description": "monthceil 함수는 입력 datetime 값을 지정된 월 간격에 맞춰 올림합니다. origin이 지정된 경우,"
}
---

## 설명 {#description}


month_ceil 함수는 입력 datetime 값을 지정된 월 간격에 맞춰 올림합니다. origin이 지정되면 해당 값을 기준으로 사용하며, 지정되지 않으면 기본값인 0001-01-01 00:00:00을 사용합니다.

날짜 계산 공식:
$$
\begin{aligned}
&\text{month\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$는 기준 시간에서 목표 시간에 도달하는 데 필요한 주기 수를 나타냅니다.

## 구문 {#syntax}

```sql
MONTH_CEIL(`<date_or_time_expr>`)
MONTH_CEIL(`<date_or_time_expr>`, `<origin>`)
MONTH_CEIL(`<date_or_time_expr>`, `<period>`)
MONTH_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr>` | 올림할 datetime 값입니다. DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 타입을 지원하는 유효한 날짜 표현식입니다. Date 타입은 해당 날짜의 시작 시간인 00:00:00으로 변환됩니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<period>` | INT 타입의 월 간격 값으로, 각 간격에 포함되는 개월 수를 나타냅니다. |
| `<origin>` | 간격의 시작 시점입니다. DATE/DATETIME/TIMESTAMP_NS 타입을 지원합니다. 기본값은 0001-01-01 00:00:00입니다. |

## 반환값 {#return-value}

`TIMESTAMP_NS` 입력은 소수 초 정밀도가 아홉 자리로 고정된 `TIMESTAMP_NS`를 반환합니다. 결과는 반환 타입의 범위를 기준으로 검증되며, `TIMESTAMP_NS`는 `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` 범위를 사용합니다.

`<origin>`이 생략된 `TIMESTAMP_NS` 입력의 경우, 문서에 명시된 기본 origin은 내부 정렬 기준으로만 사용되므로 저장 가능한 `TIMESTAMP_NS` 범위 안에 있을 필요가 없습니다.

입력 인수에 따라 선택된 시간 타입을 반환하며, 반환값은 지정된 월 간격에 맞춰 올림한 시간 값을 나타냅니다. 시간 부분은 00:00:00으로, 일 부분은 01로 설정됩니다.

- `<period>`가 양수가 아니면(≤0) 오류를 반환합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- period가 지정되지 않으면 기본값으로 1개월 간격을 사용합니다.
- `<origin>`이 지정되지 않으면 기본값인 0001-01-01 00:00:00을 기준으로 사용합니다.
- 입력이 DATE 타입인 경우(기본 시간 00:00:00).
- 계산 결과가 최대 날짜 범위인 9999-12-31 23:59:59를 초과하면 오류를 반환합니다.
- `<origin>`의 날짜와 시간이 `<period>`보다 뒤인 경우에도 위 공식에 따라 계산되지만, 주기 k는 음수가 됩니다.
- date_or_time_expr에 scale이 있으면 반환 결과에도 scale이 적용되며 소수 부분은 영이 됩니다.
- 입력이 TIMESTAMPTZ 타입이면 먼저 local_time으로 변환한 뒤(예를 들어 `2025-12-31 23:59:59+05:00`은 local_time `2026-01-01 02:59:59`를 나타내는데, 이는 세션 변수가 `+08:00`인 경우입니다) CEIL 계산을 수행합니다.
- 입력 시간 값(`<date_or_time_expr>`와 `<period>`)에 TIMESTAMPTZ와 DATETIME 타입이 모두 포함되어 있으면 출력은 DATETIME 타입입니다.

## 예제 {#examples}

```sql
-- Using default period of 1 month and default origin time 0001-01-01 00:00:00
SELECT MONTH_CEIL('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-08-01 00:00:00 |
+---------------------+

-- Using 5 months as one period, rounding up with default origin point
SELECT MONTH_CEIL('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-12-01 00:00:00 |
+---------------------+

-- If input datetime is exactly at a period starting point, return the input datetime
SELECT MONTH_CEIL('2023-12-01 00:00:00', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-12-01 00:00:00        |
+----------------------------+

-- Only with origin date and specified date
select month_ceil("2023-07-13 22:28:18", "2022-07-04 00:00:00");
+----------------------------------------------------------+
| month_ceil("2023-07-13 22:28:18", "2022-07-04 00:00:00") |
+----------------------------------------------------------+
| 2023-08-04 00:00:00                                      |
+----------------------------------------------------------+

-- Specifying origin time
SELECT MONTH_CEIL('2023-07-13 22:28:18', 5, '2023-01-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-11-01 00:00:00 |
+---------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative
SELECT MONTH_CEIL('2022-09-13 22:28:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-02-03 22:20:00 |
+---------------------+

-- Datetime with scale, time component and decimal places are all truncated to 0
SELECT MONTH_CEIL('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-12-01 00:00:00.000000 |
+----------------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MONTH_CEIL('2023-07-13', 3) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-10-01 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform MONTH_CEIL
SELECT MONTH_CEIL('2025-12-31 23:59:59+05:00');
+-----------------------------------------+
| MONTH_CEIL('2025-12-31 23:59:59+05:00') |
+-----------------------------------------+
| 2026-02-01 00:00:00+08:00               |
+-----------------------------------------+

-- If the input time values contain both TIMESTAMPTZ and DATETIME types, the output is DATETIME type.
SELECT MONTH_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+--------------------------------------------------------------------+
| MONTH_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+--------------------------------------------------------------------+
| 2026-01-15 00:00:00.123                                            |
+--------------------------------------------------------------------+

-- Calculation result exceeds maximum date range 9999-12-31, returns error
SELECT MONTH_CEIL('9999-12-13 22:28:18', 5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_ceil of 9999-12-13 22:28:18, 5 out of range

-- Period is non-positive, returns error
SELECT MONTH_CEIL('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_ceil of 2023-07-13 22:28:18, -5 out of range

-- Any parameter is NULL, returns NULL
SELECT MONTH_CEIL(NULL, 5), MONTH_CEIL('2023-07-13 22:28:18', NULL) AS result;
+----------------------+--------+
| month_ceil(NULL, 5)  | result |
+----------------------+--------+
| NULL                 | NULL   |
+----------------------+--------+
```
