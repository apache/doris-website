---
{
    "title": "HOUR_CEIL",
    "language": "ko",
    "description": "DATE, DATETIME, TIMESTAMP_NS 또는 TIMESTAMPTZ 값을 지정된 시간 주기의 가장 가까운 경계로 올림합니다."
}
---

## 설명 {#description}


HOUR_CEIL 함수는 입력 날짜/시간 값을 지정된 시간 주기의 가장 가까운 경계 시점으로 올림합니다. `DATE`, `DATETIME`, `TIMESTAMP_NS`, `TIMESTAMPTZ` 입력을 지원합니다. 예를 들어 주기가 5시간이면 입력 시각을 해당 주기의 다음 시간 경계로 조정합니다.

날짜 계산식:
$$
\begin{aligned}
&\text{hour\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{hour} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{hour} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$는 기준 시각에서 목표 시각에 도달하는 데 필요한 주기의 수를 나타냅니다.

## 구문 {#syntax}

```sql
HOUR_CEIL(`<date_or_time_expr>`)
HOUR_CEIL(`<date_or_time_expr>`, `<origin>`)
HOUR_CEIL(`<date_or_time_expr>`, `<period>`)
HOUR_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<date_or_time_expr>` | `DATE`, `DATETIME`, `TIMESTAMP_NS`, `TIMESTAMPTZ`를 지원하는 유효한 날짜 표현식입니다. `DATE` 입력은 해당 날짜의 시작 시각인 00:00:00으로 처리됩니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<period>` | 주기의 길이(단위: 시간)를 지정하는 선택적 매개변수로, 양의 정수(예: 1, 3, 5)여야 합니다. 기본값은 1이며, 1시간마다 하나의 주기를 나타냅니다. |
| `<origin>` | 시작 기준 시각입니다. `DATE`, `DATETIME`, `TIMESTAMP_NS`, `TIMESTAMPTZ`를 지원합니다. 지정하지 않으면 기본값은 0001-01-01T00:00:00입니다. |

## 반환 값 {#return-value}

`TIMESTAMP_NS` 입력은 소수점 이하 초 정밀도가 아홉 자리로 고정된 `TIMESTAMP_NS`를 반환합니다. 결과는 반환 타입의 범위를 기준으로 검증되며, `TIMESTAMP_NS`는 `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` 범위를 사용합니다.

`<origin>`이 `TIMESTAMP_NS` 입력에서 생략되면 문서에 명시된 기본 기준 시각은 내부 정렬 기준으로만 사용되며, 저장 가능한 `TIMESTAMP_NS` 범위에 포함될 필요는 없습니다.

올림한 후 가장 가까운 주기 경계 시점을 나타내는 TIMESTAMPTZ, TIMESTAMP_NS, DATETIME 또는 DATE 타입의 값을 반환합니다.

- 입력이 TIMESTAMPTZ 타입이면 먼저 local_time으로 변환한 후 CEIL 계산을 수행합니다(예: `2025-12-31 23:59:59+05:00`이 나타내는 local_time은 `2026-01-01 02:59:59`이며, 이는 세션 변수가 `+08:00`인 경우입니다).
- 입력 시간 값(`<date_or_time_expr>` 및 `<period>`)에 TIMESTAMPTZ와 DATETIME 타입이 모두 포함되어 있으면 출력은 DATETIME 타입입니다.
- 입력 주기가 양수가 아닌 정수이면 오류를 반환합니다.
- 매개변수 중 하나라도 NULL이면 결과는 NULL입니다.
- origin 또는 datetime에 scale이 있으면 반환 결과에도 scale이 포함됩니다.
- 계산 결과가 최대 날짜/시간 범위인 9999-12-31 23:59:59를 초과하면 오류를 반환합니다.
- <origin>의 날짜와 시간이 <period>보다 이후이더라도 위의 계산식에 따라 계산되지만, 주기 k는 음수가 됩니다.


## 예제 {#examples}

```sql

-- Round up with a 5-hour period
mysql> select hour_ceil("2023-07-13 22:28:18", 5);
+-------------------------------------+
| hour_ceil("2023-07-13 22:28:18", 5) |
+-------------------------------------+
| 2023-07-13 23:00:00                 |
+-------------------------------------+

-- Using 2023-07-13 08:00 as the origin, divide by 4-hour periods
mysql> select hour_ceil('2023-07-13 19:30:00', 4, '2023-07-13 08:00:00') as custom_origin;
+----------------------------+
| custom_origin              |
+----------------------------+
| 2023-07-13 20:00:00        |
+----------------------------+

-- Input date type will be converted to the start time 00:00:00 of the corresponding date
mysql> select hour_ceil('2023-07-13 00:30:00', 6, '2023-07-13');
+---------------------------------------------------+
| hour_ceil('2023-07-13 00:30:00', 6, '2023-07-13') |
+---------------------------------------------------+
| 2023-07-13 06:00:00                               |
+---------------------------------------------------+

-- If exactly at the edge of a period, return the input datetime
select hour_ceil('2023-07-13 01:00:00');
+----------------------------------+
| hour_ceil('2023-07-13 01:00:00') |
+----------------------------------+
| 2023-07-13 01:00:00              |
+----------------------------------+

--  Only with origin date and specified date
select hour_ceil("2023-07-13 22:28:18", "2023-07-01 12:12:00");
+---------------------------------------------------------+
| hour_ceil("2023-07-13 22:28:18", "2023-07-01 12:12:00") |
+---------------------------------------------------------+
| 2023-07-13 23:12:00                                     |
+---------------------------------------------------------+

-- If origin or datetime has scale, the returned result has scale
mysql> select hour_ceil('2023-07-13 19:30:00', 4, '2023-07-13 08:00:00.123') ;
+----------------------------------------------------------------+
| hour_ceil('2023-07-13 19:30:00', 4, '2023-07-13 08:00:00.123') |
+----------------------------------------------------------------+
| 2023-07-13 20:00:00.123                                        |
+----------------------------------------------------------------+

mysql> select hour_ceil('2023-07-13 19:30:00.123', 4, '2023-07-13 08:00:00') ;
+----------------------------------------------------------------+
| hour_ceil('2023-07-13 19:30:00.123', 4, '2023-07-13 08:00:00') |
+----------------------------------------------------------------+
| 2023-07-13 20:00:00.000                                        |
+----------------------------------------------------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
select hour_ceil('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00') ;
+----------------------------------------------------------------+
| hour_ceil('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00') |
+----------------------------------------------------------------+
| 2023-07-13 20:00:00.000                                        |
+----------------------------------------------------------------+

-- If calculation result exceeds maximum datetime range 9999-12-31 23:59:59, return error
select hour_ceil("9999-12-31 22:28:18", 6);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation hour_ceil of 9999-12-31 22:28:18, 6 out of range

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform HOUR_CEIL
SELECT HOUR_CEIL('2025-12-31 23:59:59+05:00');
+----------------------------------------+
| HOUR_CEIL('2025-12-31 23:59:59+05:00') |
+----------------------------------------+
| 2026-01-01 03:00:00                    |
+----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT HOUR_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+-------------------------------------------------------------------+
| HOUR_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+-------------------------------------------------------------------+
| 2026-01-01 03:00:00.123                                           |
+-------------------------------------------------------------------+

-- If period is less than or equal to 0, return error
mysql> select hour_ceil("2023-07-13 22:28:18", 0);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation hour_ceil of 2023-07-13 22:28:18, 0 out of range

-- If any input parameter is NULL, return NULL
mysql> select hour_ceil(null, 3) as null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

mysql> select hour_ceil("2023-07-13 22:28:18", NULL);
+----------------------------------------+
| hour_ceil("2023-07-13 22:28:18", NULL) |
+----------------------------------------+
| NULL                                   |
+----------------------------------------+

mysql> select hour_ceil("2023-07-13 22:28:18", 5,NULL);
+------------------------------------------+
| hour_ceil("2023-07-13 22:28:18", 5,NULL) |
+------------------------------------------+
| NULL                                     |
+------------------------------------------+
```
