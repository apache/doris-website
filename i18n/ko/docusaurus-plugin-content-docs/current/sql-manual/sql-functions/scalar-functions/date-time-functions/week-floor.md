---
{
    "title": "WEEK_FLOOR",
    "language": "ko",
    "description": "WEEKFLOOR 함수는 입력 datetime 값을 지정된 주 간격에 따라 가장 가까운 구간 시작 시각으로 내림하며, 간격 단위는 WEEK입니다."
}
---

## 설명 {#description}

WEEK_FLOOR 함수는 입력 datetime 값을 지정된 주 간격에 따라 가장 가까운 구간 시작 시각으로 내림하며, 간격 단위는 WEEK입니다. 시작 기준점(origin)을 지정하면 해당 지점을 기준으로 구간을 계산합니다. 지정하지 않으면 기본적으로 0001-01-01 00:00:00을 기준점으로 사용합니다.

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
| `<date_or_time_expr>` | 내림할 datetime 값으로, DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 타입을 지원합니다. Date 타입은 해당 날짜의 시작 시각인 00:00:00으로 변환됩니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)을 참조하고, datetime/date 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요.|
| `<period>` | 주 간격 값입니다. INT 타입이며 각 구간의 주 수를 나타냅니다. |
| `<origin>` | 구간의 시작점으로, DATE/DATETIME/TIMESTAMP_NS 타입을 지원합니다. 기본값은 0001-01-01 00:00:00입니다. |

## 반환값 {#return-value}

`TIMESTAMP_NS` 입력은 소수 초 정밀도가 아홉 자리로 고정된 `TIMESTAMP_NS`를 반환합니다. 결과는 반환 타입의 범위를 기준으로 검증되며, `TIMESTAMP_NS`에는 `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` 범위가 적용됩니다.

`<origin>`이 `TIMESTAMP_NS` 입력에서 생략된 경우, 문서에 명시된 기본 origin은 내부 정렬 기준으로만 사용되므로 저장 가능한 `TIMESTAMP_NS` 범위에 속할 필요가 없습니다.

입력 인수에 따라 선택된 날짜/시간 타입으로 내림한 datetime 값을 반환합니다. 결과의 시간 부분은 origin의 시간으로 설정됩니다.

- 입력이 NULL이 아니고 `<period>`가 양수가 아니면(≤0) 오류를 반환합니다;
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다;
- `<datetime>`이 구간 시작점에 정확히 일치하면(`<period>`와 `<origin>` 기준) 해당 시작점을 반환합니다;
- 입력이 date 타입이면 date 타입을 반환합니다.
- 입력이 datetime 타입이면 시간 부분이 origin의 시간과 같은 datetime 타입을 반환합니다.
- `<origin>`의 날짜와 시간이 `<date_or_time_expr>`보다 나중이어도 위 공식에 따라 계산되지만, 구간 수 k는 음수가 됩니다.
- `date_or_time_expr`에 소수 자릿수가 있으면 결과에도 해당 정밀도가 유지됩니다. `origin`에 소수 초가 포함되어 있으면 구간 경계에도 해당 소수 초가 유지됩니다. Doris 4.1 계열의 4.1.5부터는 주 경계 비교 시 마이크로초를 고려하여, 입력과 `origin`이 소수 초에서만 차이 날 때의 내림 동작을 바로잡습니다.
- 입력이 TIMESTAMPTZ 타입이면 먼저 local_time으로 변환한 다음 FLOOR 계산을 수행합니다(예를 들어 `2025-12-31 23:59:59+05:00`은 local_time `2026-01-01 02:59:59`을 나타내며, 이때 세션 변수는 `+08:00`입니다).
- 입력 시간 값(`<date_or_time_expr>`와 `<origin>`)에 TIMESTAMPTZ와 DATETIME 타입이 모두 포함되어 있으면 출력은 DATETIME 타입입니다.

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

입력이 구간 경계에 정확히 일치하면 값이 그대로 유지됩니다:

```sql
SELECT WEEK_FLOOR('2023-07-10 00:00:00', 2);
```

```text
2023-07-10 00:00:00
```

origin에 마이크로초가 포함된 경우의 주 경계(Doris 4.1 계열의 4.1.5부터 수정됨):

```sql
SELECT WEEK_FLOOR(CAST('2024-01-08 00:00:00.400000' AS DATETIME(6)),
                   1, CAST('2024-01-01 00:00:00.500000' AS DATETIME(6)));
```

```text
2024-01-01 00:00:00.500000
```
