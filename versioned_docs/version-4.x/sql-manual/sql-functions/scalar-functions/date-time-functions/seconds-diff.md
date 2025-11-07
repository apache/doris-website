---
{
    "title": "SECONDS_DIFF",
    "language": "en"
}
---

## Description

The SECONDS_DIFF function calculates the difference between two datetime values and returns the result in seconds. This function supports processing DATE and DATETIME types. If the input is DATE type, its time portion defaults to 00:00:00.

## Syntax

```sql
SECONDS_DIFF(<date_or_time_expr1>, <date_or_time_expr2>)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr1>` | Required. The ending datetime value. Can be of type DATE or DATETIME. For specific datetime/date formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<date_or_time_expr2>` | Required. The starting datetime value. Can be of type DATE or DATETIME. |

## Return Value

Returns a value of type BIGINT, representing the difference in seconds between the two datetime values:

- If `<date_or_time_expr1>` is later than `<date_or_time_expr2>`, returns a positive number;
- If `<date_or_time_expr1>` is earlier than `<date_or_time_expr2>`, returns a negative number;
- If the two times are equal, returns 0;
- If any parameter is NULL, returns NULL;
- For times with scale, the fractional part difference is included in the calculation.

## Examples

```sql
--- Seconds difference within the same hour
SELECT SECONDS_DIFF('2025-01-23 12:35:56', '2025-01-23 12:34:56') AS result;
+--------+
| result |
+--------+
|     60 |
+--------+

--- End time is earlier than start time (returns negative number)
SELECT SECONDS_DIFF('2023-01-01 00:00:00', '2023-01-01 00:01:00') AS result;
+--------+
| result |
+--------+
|    -60 |
+--------+

--- Input is DATE type (default time 00:00:00)
SELECT SECONDS_DIFF('2023-01-02', '2023-01-01') AS result;  -- 1 day difference (86400 seconds)
+--------+
| result |
+--------+
|  86400 |
+--------+

--- Times with scale include fractional part difference in calculation
mysql> SELECT SECONDS_DIFF('2023-07-13 12:00:00', '2023-07-13 11:59:59.6') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- Any parameter is NULL (returns NULL)
SELECT SECONDS_DIFF(NULL, '2023-07-13 10:30:25'), SECONDS_DIFF('2023-07-13 10:30:25', NULL) AS result;
+-------------------------------------------+--------+
| seconds_diff(NULL, '2023-07-13 10:30:25') | result |
+-------------------------------------------+--------+
| NULL                                      | NULL   |
+-------------------------------------------+--------+
```
