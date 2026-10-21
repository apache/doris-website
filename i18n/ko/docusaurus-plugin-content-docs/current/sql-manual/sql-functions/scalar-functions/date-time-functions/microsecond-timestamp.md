---
{
    "title": "MICROSECOND_TIMESTAMP",
    "language": "ko",
    "description": "DATETIME 또는 TIMESTAMP_NS 값을 마이크로초 단위의 Unix 타임스탬프로 변환하며, 마이크로초 미만의 자릿수는 버립니다."
}
---

## 설명 {#description}

MICROSECOND_TIMESTAMP 함수는 `DATETIME` 또는 `TIMESTAMP_NS` 값을 마이크로초 단위의 Unix 타임스탬프로 변환합니다. `TIMESTAMP_NS`의 경우 나노초 값의 마지막 세 자릿수를 버립니다.

## 구문 {#syntax}

```sql
MICROSECOND_TIMESTAMP(`<datetime>`)
```

## 매개변수 {#parameters}

| 매개변수       | 설명                                                                                   |
|------------------|-----------------------------------------------------------------------------------------------|
| `<datetime>` | 변환할 `DATETIME` 또는 `TIMESTAMP_NS` 값입니다. |

## 반환 값 {#return-value}

입력 날짜 및 시간에 해당하는 Unix 타임스탬프를 마이크로초 단위의 `BIGINT` 정수로 반환합니다(현재 시간대로 변환한 총 마이크로초 수).

- 입력이 `NULL`이면 함수는 `NULL`을 반환합니다.
- 입력 날짜 및 시간이 1970-01-01 00:00:00.000 UTC보다 이전이면 결과는 음수입니다.

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
