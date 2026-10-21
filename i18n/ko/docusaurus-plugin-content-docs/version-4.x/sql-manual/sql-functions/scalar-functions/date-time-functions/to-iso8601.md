---
{
    "title": "TO_ISO8601 | 날짜 및 시간 함수",
    "language": "ko",
    "description": "날짜 및 시간 값을 ISO8601 형식의 문자열로 변환하며, DATETIME, DATE 및 TIMESTAMPTZ 입력 타입을 지원합니다.",
    "sidebar_label": "TO_ISO8601"
}
---

# TO_ISO8601 {#to_iso8601}

## 설명 {#description}

날짜 및 시간 값을 ISO8601 형식의 문자열로 변환하며, DATETIME, DATE 및 TIMESTAMPTZ 입력 타입을 지원합니다.
반환되는 ISO8601 형식의 날짜 및 시간은 YYYY-MM-DDTHH:MM:SS로 표현되며, T는 날짜와 시간 사이의 구분자입니다.

## 구문 {#syntax}

```sql
TO_ISO8601(`<date_or_date_expr>`)
```

## 매개변수 {#parameters}
| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_date_expr>` | 입력 날짜 및 시간 값으로, date/datetime/timestamptz 타입을 지원합니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |

## 반환 값 {#return-value}

ISO8601 형식의 날짜 및 시간 문자열을 나타내는 VARCHAR 타입을 반환합니다.

- 입력이 DATE인 경우(예: '2023-10-05'), YYYY-MM-DD 형식으로 반환합니다(날짜만 포함).
- 입력이 DATETIME인 경우(예: '2023-10-05 15:30:25'), YYYY-MM-DDTHH:MM:SS.xxxxxx 형식으로 반환합니다(날짜와 시간은 T로 구분되며, xxxxxx는 모두 영입니다. 입력 날짜 및 시간의 소수 초는 초 단위로 반올림됩니다).
- 입력이 TIMESTAMPTZ인 경우(예: '2023-10-05 15:30:25+03:00'), YYYY-MM-DDTHH:MM:SS.xxxxxx±HH:MM 형식으로 반환합니다(오프셋은 local_time으로 변환한 후 세션 변수 `time_zone`을 반영합니다).
- 입력이 NULL인 경우, NULL을 반환합니다.

## 예제 {#examples}

```sql
-- Convert DATE type (date only)
SELECT TO_ISO8601(CAST('2023-10-05' AS DATE)) AS date_result;
+--------------+
| date_result  |
+--------------+
| 2023-10-05   |
+--------------+

-- Convert DATETIME type (with hours, minutes, seconds)
SELECT TO_ISO8601(CAST('2020-01-01 12:30:45' AS DATETIME)) AS datetime_result;
+----------------------------+
| datetime_result            |
+----------------------------+
| 2020-01-01T12:30:45.000000 |
+----------------------------+

-- Input with fractional seconds, rounded to seconds
SELECT TO_ISO8601(CAST('2020-01-01 12:30:45.956' AS DATETIME)) AS datetime_result;
+----------------------------+
| datetime_result            |
+----------------------------+
| 2020-01-01T12:30:46.000000 |
+----------------------------+

-- Input TIMESTAMPTZ, SET time_zone = '+08:00'
SELECT TO_ISO8601('2025-10-10 11:22:33+03:00');
+-----------------------------------------+
| TO_ISO8601('2025-10-10 11:22:33+03:00') |
+-----------------------------------------+
| 2025-10-10T16:22:33.000000+08:00        |
+-----------------------------------------+

-- Invalid date (returns NULL)
SELECT TO_ISO8601('2023-02-30') AS invalid_date;
+--------------+
| invalid_date |
+--------------+
| NULL         |
+--------------+

-- Input is NULL (returns NULL)
SELECT TO_ISO8601(NULL) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+
```
