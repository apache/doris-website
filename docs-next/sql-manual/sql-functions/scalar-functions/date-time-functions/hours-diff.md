---
{
    "title": "HOURS_DIFF",
    "language": "en",
    "description": "The HOURSDIFF function calculates the hour difference between two datetime or date values,"
}
---

## Description

The HOURS_DIFF function calculates the hour difference between two datetime or date values, representing the number of hours elapsed from the start time to the end time. This function supports both DATE and DATETIME input types, automatically handles time difference calculations across days, months, and years, and returns an integer result. If the input is DATE type (containing only year, month, day), it defaults the time part to 00:00:00.

## Syntax

```sql
HOURS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## Parameters

| Parameter | Description |
| ---- | ---- |
| `<date_or_time_expr1>` | End time, a valid date expression that supports date/datetime types. For specific datetime and date formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<date_or_time_expr2>` | Start time, a valid date expression that supports date/datetime types and strings in datetime format |

## Return Value

Returns BIGINT type, representing the hour difference between `<date_or_time_expr1>` and `<date_or_time_expr2>`.

- If `<date_or_time_expr1>` is later than `<date_or_time_expr2>`, returns a positive number; if earlier, returns a negative number.
- If any input parameter is NULL, returns NULL.
- Including minute and below unit, if the actual difference is less than one hour, the calculation result is reduced by one.

## Examples

```sql

-- End time is later than start time, returns positive number
SELECT HOURS_DIFF('2020-12-25 22:00:00', '2020-12-25 21:00:00');
+----------------------------------------------------------+
| HOURS_DIFF('2020-12-25 22:00:00', '2020-12-25 21:00:00') |
+----------------------------------------------------------+
|                                                        1 |
+----------------------------------------------------------+

-- End time is earlier than start time, returns negative number
select hours_diff('2020-12-25 20:00:00', '2020-12-25 21:00:00');
+----------------------------------------------------------+
| hours_diff('2020-12-25 20:00:00', '2020-12-25 21:00:00') |
+----------------------------------------------------------+
|                                                       -1 |
+----------------------------------------------------------+

-- Contains minute time, if actual difference is less than one hour, calculation result is reduced by one
select hours_diff('2020-12-25 20:59:00', '2020-12-25 21:00:00');
+----------------------------------------------------------+
| hours_diff('2020-12-25 20:59:00', '2020-12-25 21:00:00') |
+----------------------------------------------------------+
|                                                        0 |
+----------------------------------------------------------+

-- End time is date type, defaults to 00:00:00 start
select hours_diff('2023-12-31', '2023-12-30 12:00:00');
+-------------------------------------------------+
| hours_diff('2023-12-31', '2023-12-30 12:00:00') |
+-------------------------------------------------+
|                                              12 |
+-------------------------------------------------+

-- Any parameter is NULL, return NULL
select hours_diff(null, '2023-10-01') ;
+--------------------------------+
| hours_diff(null, '2023-10-01') |
+--------------------------------+
|                           NULL |
+--------------------------------+

select hours_diff('2023-12-31', NULL);
+--------------------------------+
| hours_diff('2023-12-31', NULL) |
+--------------------------------+
|                           NULL |
+--------------------------------+

```