---
{
    "title": "MILLISECONDS_DIFF",
    "language": "en"
}
---

## Description

The `MILLISECONDS_DIFF` function calculates the difference in milliseconds between two datetime values. The result is the number of milliseconds obtained by subtracting the start time from the end time. This function supports processing `DATETIME` types.

## Syntax

```sql
MILLISECONDS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr1>` | The end time, of type `DATETIME`. For specific datetime formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<date_or_time_expr2>` | The start time, of type `DATETIME`. For specific datetime formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Return Value

Returns an `INT` type value, representing the difference in milliseconds between the two times.

- If `<date_or_time_expr1>` is later than `<date_or_time_expr2>`, the result is positive.
- If `<date_or_time_expr1>` is earlier than `<date_or_time_expr2>`, the result is negative.
- If the two times are identical (including the millisecond part), the result is 0.
- If the input is of `DATE` type (only includes year, month, and day), the default time part is set to `00:00:00.000`.
- If the input time includes microseconds (e.g., `'2023-01-01 00:00:00.123456'`), it is automatically truncated to millisecond precision for calculation (e.g., `123 milliseconds`).
- If any parameter is `NULL`, the function returns `NULL`.

## Examples

```sql
-- Calculate millisecond difference
SELECT MILLISECONDS_DIFF('2020-12-25 21:00:00.623000', '2020-12-25 21:00:00.123000');
+-------------------------------------------------------------------------------+
| MILLISECONDS_DIFF('2020-12-25 21:00:00.623000', '2020-12-25 21:00:00.123000') |
+-------------------------------------------------------------------------------+
|                                                                           500 |
+-------------------------------------------------------------------------------+

-- End time is earlier than start time, returns negative value
SELECT MILLISECONDS_DIFF('2023-10-01 12:00:00.500', '2023-10-01 12:00:00.800');
+-------------------------------------------------------------------------+
| MILLISECONDS_DIFF('2023-10-01 12:00:00.500', '2023-10-01 12:00:00.800') |
+-------------------------------------------------------------------------+
|                                                                    -300 |
+-------------------------------------------------------------------------+

-- Input includes microseconds (automatically truncated to milliseconds)
SELECT MILLISECONDS_DIFF('2023-01-01 00:00:00.123456', '2023-01-01 00:00:00.000123');
+-------------------------------------------------------------------------------+
| MILLISECONDS_DIFF('2023-01-01 00:00:00.123456', '2023-01-01 00:00:00.000123') |
+-------------------------------------------------------------------------------+
|                                                                           123 |
+-------------------------------------------------------------------------------+

-- Input is of DATE type (default time is 00:00:00.000)
SELECT MILLISECONDS_DIFF('2023-10-02', '2023-10-01');
+-----------------------------------------------+
| MILLISECONDS_DIFF('2023-10-02', '2023-10-01') |
+-----------------------------------------------+
|                                      86400000 |
+-----------------------------------------------+

-- Any parameter is NULL, returns NULL
SELECT MILLISECONDS_DIFF('2023-01-01 00:00:00', NULL), MILLISECONDS_DIFF(NULL, '2023-01-01 00:00:00');
+------------------------------------------------+------------------------------------------------+
| milliseconds_diff('2023-01-01 00:00:00', NULL) | milliseconds_diff(NULL, '2023-01-01 00:00:00') |
+------------------------------------------------+------------------------------------------------+
| NULL                                           | NULL                                           |
+------------------------------------------------+------------------------------------------------+

-- Times are identical, returns 0
SELECT MILLISECONDS_DIFF('2025-08-11 15:30:00.123', '2025-08-11 15:30:00.123');
+-------------------------------------------------------------------------+
| MILLISECONDS_DIFF('2025-08-11 15:30:00.123', '2025-08-11 15:30:00.123') |
+-------------------------------------------------------------------------+
|                                                                       0 |
+-------------------------------------------------------------------------+
```