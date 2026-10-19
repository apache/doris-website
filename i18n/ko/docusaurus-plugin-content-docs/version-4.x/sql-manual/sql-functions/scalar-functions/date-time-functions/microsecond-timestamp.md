---
{
    "title": "MICROSECOND_TIMESTAMP",
    "language": "ko",
    "description": "MICROSECONDTIMESTAMP 함수는 입력 날짜 및 시간 값을 1970-01-01 00:00:00부터 계산한 Unix 타임스탬프로 변환하는 데 사용됩니다(보정 기준: "
}
---

## 설명 {#description}

MICROSECOND_TIMESTAMP 함수는 입력 날짜 및 시간 값을 1970-01-01 00:00:00부터 계산한 Unix 타임스탬프로 변환하는 데 사용됩니다. 로컬 시간대 오프셋을 반영하며, 단위는 마이크로초입니다(1초 = 1,000,000마이크로초). 이 함수는 마이크로초 정밀도의 DATETIME 타입 처리를 지원하며, 변환 시 시간대 차이를 자동으로 무시합니다(UTC 시간을 기본 기준으로 사용).

## 구문 {#syntax}

```sql
MICROSECOND_TIMESTAMP(`<datetime>`)
```

## 매개변수 {#parameters}

| 매개변수       | 설명                                                                                   |
|------------------|-----------------------------------------------------------------------------------------------|
| `<datetime>`     | Unix 타임스탬프로 변환할 날짜 및 시간을 나타냅니다. `DATETIME` 타입을 지원합니다. 구체적인 날짜 및 시간 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)을 참조하세요. |

## 반환 값 {#return-value}

입력 날짜 및 시간에 해당하는 마이크로초 단위의 Unix 타임스탬프를 나타내는 `BIGINT` 정수를 반환합니다(현재 시간대로 변환한 총 마이크로초 수).

- 입력이 `NULL`이면 함수는 `NULL`을 반환합니다.
- 입력 날짜 및 시간이 1970-01-01 00:00:00.000 UTC 이전이면 결과는 음수입니다.

## 예제 {#examples}

```sql
-- Convert a DATETIME with microsecond precision, executed in a machine with the East 8 time zone
SELECT MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456');
+-----------------------------------------------------+
| MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456') |
+-----------------------------------------------------+
|                                    1737606896123456 |
+-----------------------------------------------------+

-- Explicitly specify the time zone as UTC
SELECT MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456 UTC');
+---------------------------------------------------------+
| MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456 UTC') |
+---------------------------------------------------------+
|                                        1737635696123456 |
+---------------------------------------------------------+

-- Input type is DATE, time part is automatically set to 00:00:00.000000
SELECT MICROSECOND_TIMESTAMP('1970-01-01');
+-------------------------------------+
| MICROSECOND_TIMESTAMP('1970-01-01') |
+-------------------------------------+
|                        -28800000000 |
+-------------------------------------+

-- Specified time zone is out of range, returns NULL
SELECT MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456 +15:00');
+------------------------------------------------------------+
| MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456 +15:00') |
+------------------------------------------------------------+
|                                                       NULL |
+------------------------------------------------------------+

-- If the input datetime is before 1970 (standard UTC), returns a negative value
SELECT MICROSECOND_TIMESTAMP('1960-01-01 00:00:00 UTC');
+---------------------------------------------------+
| MICROSECOND_TIMESTAMP('1960-01-01 00:00:00 UTC')  |
+---------------------------------------------------+
|                                  -315619200000000 |
+---------------------------------------------------+

-- Input is NULL, returns NULL
SELECT MICROSECOND_TIMESTAMP(NULL);
+-----------------------------+
| MICROSECOND_TIMESTAMP(NULL) |
+-----------------------------+
|                        NULL  |
+-----------------------------+
```
