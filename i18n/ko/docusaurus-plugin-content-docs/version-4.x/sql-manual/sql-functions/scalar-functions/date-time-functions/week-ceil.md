---
{
    "title": "WEEK_CEIL",
    "language": "ko",
    "description": "weekceil 함수는 입력 datetime 값을 지정된 주 간격에 맞춰 가장 가까운 시작 시각으로 올림합니다. origin이 지정되면,"
}
---

## 설명 {#description}


week_ceil 함수는 입력 datetime 값을 지정된 주 간격에 맞춰 가장 가까운 시작 시각으로 올림합니다. origin이 지정되면 이를 기준으로 사용하며, 지정되지 않으면 기본값인 0001-01-01 00:00:00을 사용합니다.

날짜 계산 공식:
$$
\begin{aligned}
&\text{week\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{week} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{week} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$는 기준 시각에서 목표 시각에 도달하는 데 필요한 주기의 수를 나타냅니다.

## 구문 {#syntax}

```sql
WEEK_CEIL(<date_or_time_expr>)
WEEK_CEIL(<date_or_time_expr>, <origin>)
WEEK_CEIL(<date_or_time_expr>, <period>)
WEEK_CEIL(<date_or_time_expr>, <period>, <origin>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_time_expr>` | 올림할 datetime 값으로, date/datetime/timestamptz 타입을 지원합니다. date 타입은 해당 날짜의 시작 시각인 00:00:00으로 변환됩니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)을 참고하고, datetime/date 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참고하세요. |
| `<period>` | 주 간격 값으로, INT 타입이며 각 간격에 포함되는 주의 수를 나타냅니다. |
| `<origin>` | 간격의 시작 기준점으로, date/datetime 타입을 지원하며 기본값은 0001-01-01 00:00:00입니다. |

## 반환값 {#return-value}

올림한 datetime 값을 나타내는 TIMESTAMPTZ, DATETIME 또는 DATE를 반환합니다.

- 입력이 NULL이 아니고 `<period>`가 양수가 아니면(≤0) 함수는 오류를 반환합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- `<datetime>`이 간격의 시작점(`<period>` 및 `<origin>` 기준)과 정확히 일치하면 해당 시작점을 반환합니다.
- 입력이 date 타입이면 date 타입을 반환합니다.
- 입력이 datetime 타입이면 origin 시각과 동일한 시간 부분을 갖는 datetime 타입을 반환합니다.
- 계산 결과가 datetime의 최댓값인 9999-12-31 23:59:59를 초과하면 오류를 반환합니다.
- `<origin>`의 날짜와 시간이 `<date_or_time_expr>`보다 이후이면 위 공식에 따라 계산하되, 주기 k는 음수가 됩니다.
- `date_or_time_expr`에 scale이 있으면 결과는 해당 정밀도를 유지합니다. `origin`에 초의 소수 부분이 포함되어 있으면 간격 경계도 해당 소수 부분을 유지합니다. Doris 4.1 시리즈에서는 4.1.5부터 주 경계를 비교할 때 마이크로초를 고려하여 입력과 `origin`이 초의 소수 부분에서만 다를 때의 올림을 바로잡습니다.
- 입력이 TIMESTAMPTZ 타입이면 먼저 local_time으로 변환한 다음(예: `2025-12-31 23:59:59+05:00`은 local_time `2026-01-01 02:59:59`에 해당하며, 이는 세션 변수 값이 `+08:00`인 경우입니다) CEIL 계산을 수행합니다.
- 입력 시간 값(`<date_or_time_expr>` 및 `<origin>`)에 TIMESTAMPTZ와 DATETIME 타입이 모두 포함되어 있으면 출력은 DATETIME 타입입니다.

<a id="examples"></a>

## 예제 {#example}

```sql
-- 2023-07-13 is Thursday, rounds up to next interval start (1-week interval starts on Monday, so rounds to 2023-07-17 (Monday))
SELECT WEEK_CEIL(cast('2023-07-13 22:28:18' as datetime)) AS result;
```

```text
+---------------------+
| result              |
+---------------------+
| 2023-07-17 00:00:00 |
+---------------------+
```

```sql
-- Specify 2-week interval
SELECT WEEK_CEIL('2023-07-13 22:28:18', 2) AS result;
```

```text
+---------------------+
| result              |
+---------------------+
| 2023-07-24 00:00:00 |
+---------------------+
```

```sql
-- Input date type returns date type, date string returns datetime
SELECT WEEK_CEIL(cast('2023-07-13' as date));
```

```text
+---------------------------------------+
| WEEK_CEIL(cast('2023-07-13' as date)) |
+---------------------------------------+
| 2023-07-17                            |
+---------------------------------------+
```

```sql
--input with decimal part 
SELECT WEEK_CEIL('2023-07-13 22:28:18.123', 2) AS result;
```

```text
+-------------------------+
| result                  |
+-------------------------+
| 2023-07-24 00:00:00.000 |
+-------------------------+
```

```sql
-- Only with origin date and specified date
select week_ceil("2023-07-13 22:28:18", "2021-05-01 12:00:00");
```

```text
+---------------------------------------------------------+
| week_ceil("2023-07-13 22:28:18", "2021-05-01 12:00:00") |
+---------------------------------------------------------+
| 2023-07-15 12:00:00                                     |
+---------------------------------------------------------+
```

```sql
-- Specify origin date
SELECT WEEK_CEIL('2023-07-13', 1, '2023-07-03') AS result;
```

```text
+---------------------+
| result              |
+---------------------+
| 2023-07-17 00:00:00 |
+---------------------+
```

```sql
-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform WEEK_CEIL
SELECT WEEK_CEIL('2025-12-31 23:59:59+05:00');
```

```text
+----------------------------------------+
| WEEK_CEIL('2025-12-31 23:59:59+05:00') |
+----------------------------------------+
| 2026-01-05 00:00:00+08:00              |
+----------------------------------------+
```

```sql
-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT WEEK_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
```

```text
+-------------------------------------------------------------------+
| WEEK_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+-------------------------------------------------------------------+
| 2026-01-05 00:00:00.123                                           |
+-------------------------------------------------------------------+
```

```sql
-- Invalid period (non-positive integer)
SELECT WEEK_CEIL('2023-07-13', 0) AS result;
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation week_ceil of 2023-07-13 00:00:00, 0 out of range
```

```sql
-- Parameter is NULL
SELECT WEEK_CEIL(NULL, 1) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```

입력이 간격 경계와 정확히 일치하면 값이 변경되지 않습니다.

```sql
SELECT WEEK_CEIL('2023-07-24 00:00:00', 2);
```

```text
2023-07-24 00:00:00
```

origin에 마이크로초가 포함된 경우의 주 경계(Doris 4.1 시리즈의 4.1.5부터 수정됨):

```sql
SELECT WEEK_CEIL(CAST('2024-01-08 00:00:00.600000' AS DATETIME(6)),
                   1, CAST('2024-01-01 00:00:00.500000' AS DATETIME(6)));
```

```text
2024-01-15 00:00:00.500000
```
