---
{
    "title": "MICROSECONDS_DIFF",
    "language": "en",
    "description": "Calculates the number of whole microseconds between DATETIME or TIMESTAMP_NS values, including mixed-type arguments."
}
---

## Description

The MICROSECONDS_DIFF function calculates the difference in microseconds between two datetime values. The result is the number of whole microseconds in the interval between the end time and the start time. It supports DATETIME and TIMESTAMP_NS, including mixed arguments.

## Syntax

```sql
MICROSECONDS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr1>` | The end time, of type DATETIME or TIMESTAMP_NS. For supported formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [timestamp_ns conversion](../../../basic-element/sql-data-types/conversion/timestamp-ns-conversion.md). |
| `<date_or_time_expr2>` | The start time, of type DATETIME, TIMESTAMP_NS, or a valid datetime string. |

## Return Value

Returns a BIGINT type, representing the difference in microseconds between the two times.
- If `<date_or_time_expr1>` is greater than `<date_or_time_expr2>`, returns a positive number.
- If `<date_or_time_expr1>` is less than `<date_or_time_expr2>`, returns a negative number.
- If the two times are identical (including the microsecond part), returns 0.
- Any remaining nanoseconds that do not form a complete microsecond are truncated toward zero. Use [NANOSECONDS_DIFF](./nanoseconds-diff) for an exact nanosecond difference.
- If any parameter is NULL, returns NULL.

## Examples

```sql
-- Calculate the microsecond difference between two datetime values
SELECT MICROSECONDS_DIFF('2020-12-25 21:00:00.623000', '2020-12-25 21:00:00.123000');

+------------------------------------------------------------------------------+
| MICROSECONDS_DIFF('2020-12-25 21:00:00.623000','2020-12-25 21:00:00.123000') |
+------------------------------------------------------------------------------+
|                                                                       500000 |
+------------------------------------------------------------------------------+

--If the end time is earlier than the start time, a negative number is returned.
SELECT MICROSECONDS_DIFF('2023-10-01 12:00:00.500000', '2023-10-01 12:00:00.800000');
+-------------------------------------------------------------------------------+
| MICROSECONDS_DIFF('2023-10-01 12:00:00.500000', '2023-10-01 12:00:00.800000') |
+-------------------------------------------------------------------------------+
|                                                                       -300000 |
+-------------------------------------------------------------------------------+

-- TIMESTAMP_NS values can be compared at nanosecond precision; incomplete microseconds are truncated
SELECT MICROSECONDS_DIFF(
    CAST('2025-01-02 03:04:05.123457788' AS TIMESTAMP_NS),
    CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS)
);
+----------------------------------------------------------------------------------------------------+
| MICROSECONDS_DIFF(CAST('2025-01-02 03:04:05.123457788' AS TIMESTAMP_NS), CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS)) |
+----------------------------------------------------------------------------------------------------+
|                                                                                                  0 |
+----------------------------------------------------------------------------------------------------+

-- Input type is date, time part defaults to 00:00:00.000000
SELECT MICROSECONDS_DIFF('2023-10-01 12:00:00.500000', '2023-10-01');
+---------------------------------------------------------------+
| MICROSECONDS_DIFF('2023-10-01 12:00:00.500000', '2023-10-01') |
+---------------------------------------------------------------+
|                                                   43200500000 |
+---------------------------------------------------------------+

-- Any parameter is NULL, returns NULL
SELECT MICROSECONDS_DIFF('2023-01-01 00:00:00', NULL), MICROSECONDS_DIFF(NULL, '2023-01-01 00:00:00');
+------------------------------------------------+------------------------------------------------+
| MICROSECONDS_DIFF('2023-01-01 00:00:00', NULL) | MICROSECONDS_DIFF(NULL, '2023-01-01 00:00:00') |
+------------------------------------------------+------------------------------------------------+
|                                           NULL |                                           NULL |
+------------------------------------------------+------------------------------------------------+

--- datetime is same,return 0
 SELECT MICROSECONDS_DIFF('2025-08-11 15:30:00.123456', '2025-08-11 15:30:00.123456');
+-------------------------------------------------------------------------------+
| MICROSECONDS_DIFF('2025-08-11 15:30:00.123456', '2025-08-11 15:30:00.123456') |
+-------------------------------------------------------------------------------+
|                                                                             0 |
+-------------------------------------------------------------------------------+
```
