---
{
    "title": "MILLISECOND_TIMESTAMP",
    "language": "ko",
    "description": "MILLISECONDTIMESTAMP 함수는 입력 datetime 값을 1970-01-01 00:00:00부터 계산한 Unix 타임스탬프로 변환합니다(현지 "
}
---

## 설명 {#description}

`MILLISECOND_TIMESTAMP` 함수는 입력 datetime 값을 `1970-01-01 00:00:00`을 기준으로 계산한 Unix 타임스탬프로 변환합니다(현지 시간대 오프셋 적용). 단위는 밀리초입니다(1초 = 1,000밀리초). 이 함수는 밀리초 정밀도의 `DATETIME` 타입을 처리할 수 있으며, 변환 시 시간대 차이를 자동으로 무시합니다(UTC 시간을 기본 기준으로 사용).

## 구문 {#syntax}

```sql
MILLISECOND_TIMESTAMP(`<datetime>`)
```

## 매개변수 {#parameters}

| 매개변수    | 설명                                                                                   |
|--------------|-----------------------------------------------------------------------------------------------|
| `<datetime>` | Unix 타임스탬프로 변환할 datetime을 나타냅니다. `DATETIME` 타입을 지원합니다. 구체적인 datetime 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)을 참조하세요. |

## 반환 값 {#return-value}

입력 datetime에 해당하는 밀리초 단위의 Unix 타임스탬프를 나타내는 `BIGINT` 정수를 반환합니다(현재 시간대로 변환한 총 밀리초). 시간대 설정은 [시간대 관리](../../../../admin-manual/cluster-management/time-zone)를 참조하세요.

- 입력이 `NULL`이면 함수는 `NULL`을 반환합니다.
- 마이크로초가 포함된 datetime 값을 변환합니다(밀리초 미만 자릿수는 자동으로 잘림).
- 입력 datetime이 `1970-01-01 00:00:00.000 UTC` 이전이면 결과는 음수입니다.

## 예제 {#examples}

```sql
-- Convert a DATETIME with millisecond precision, executed in a machine with the East 8 time zone
SELECT MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123');
+--------------------------------------------------+
| MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123') |
+--------------------------------------------------+
|                                    1737606896123 |
+--------------------------------------------------+

-- Explicitly specify the time zone as UTC
SELECT MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123 UTC');
+------------------------------------------------------+
| MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123 UTC') |
+------------------------------------------------------+
|                                        1737635696123 |
+------------------------------------------------------+

-- Convert datetime values with microseconds (automatically truncated to milliseconds)
SELECT MILLISECOND_TIMESTAMP('2024-01-01 00:00:00.123456');
+-----------------------------------------------------+
| MILLISECOND_TIMESTAMP('2024-01-01 00:00:00.123456') |
+-----------------------------------------------------+
|                                       1704038400123 |
+-----------------------------------------------------+

-- Specified time zone is out of range, returns NULL
SELECT MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123456 +15:00');
+------------------------------------------------------------+
| MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123456 +15:00') |
+------------------------------------------------------------+
|                                                       NULL |
+------------------------------------------------------------+

-- If the input datetime is before 1970 (standard UTC), returns a negative value
SELECT MILLISECOND_TIMESTAMP('1960-01-01 00:00:00 UTC');
+---------------------------------------------------+
| MILLISECOND_TIMESTAMP('1960-01-01 00:00:00 UTC') |
+---------------------------------------------------+
|                                     -315619200000 |
+---------------------------------------------------+

-- Input type is DATE, time part is automatically set to 00:00:00.000 (results are negative in East 8 time zone)
SELECT MILLISECOND_TIMESTAMP('1970-01-01');
+-------------------------------------+
| MILLISECOND_TIMESTAMP('1970-01-01') |
+-------------------------------------+
|                           -28800000 |
+-------------------------------------+

-- Input is NULL, returns NULL
SELECT MILLISECOND_TIMESTAMP(NULL);
+-----------------------------+
| MILLISECOND_TIMESTAMP(NULL) |
+-----------------------------+
|                        NULL |
+-----------------------------+
```
