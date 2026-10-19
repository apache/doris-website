---
{
    "title": "MILLISECOND_TIMESTAMP",
    "language": "ko",
    "description": "DATETIME 또는 TIMESTAMP_NS 값을 밀리초 단위의 Unix 타임스탬프로 변환하며, 밀리초 미만의 자릿수는 잘라냅니다."
}
---

## 설명 {#description}

`MILLISECOND_TIMESTAMP` 함수는 `DATETIME` 또는 `TIMESTAMP_NS` 값을 밀리초 단위의 Unix 타임스탬프로 변환합니다. 밀리초 미만의 소수 자릿수는 잘라냅니다.

## 구문 {#syntax}

```sql
MILLISECOND_TIMESTAMP(`<datetime>`)
```

## 매개변수 {#parameters}

| 매개변수    | 설명                                                                                   |
|--------------|-----------------------------------------------------------------------------------------------|
| `<datetime>` | 변환할 `DATETIME` 또는 `TIMESTAMP_NS` 값입니다. |

## 반환 값 {#return-value}

입력 날짜 및 시간에 해당하는 밀리초 단위의 Unix 타임스탬프(현재 시간대로 변환된 총 밀리초 수)를 나타내는 `BIGINT` 정수를 반환합니다. 시간대 설정에 대한 자세한 내용은 [시간대 관리](../../../../admin-manual/cluster-management/time-zone)를 참조하세요.

- 입력이 `NULL`이면 함수는 `NULL`을 반환합니다.
- 마이크로초가 포함된 날짜 및 시간 값을 변환합니다(밀리초 단위로 자동으로 잘라냅니다).
- 입력 날짜 및 시간이 `1970-01-01 00:00:00.000 UTC` 이전이면 결과는 음수입니다.

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
