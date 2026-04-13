---
{
    "title": "FROM_UNIXTIME",
    "language": "en",
    "description": "The FROMUNIXTIME function is used to convert a Unix timestamp (in seconds) to a date-time string or VARCHAR type value in a specified format."
}
---

## Description


The FROM_UNIXTIME function is used to convert a Unix timestamp (in seconds) to a date-time string or VARCHAR type value in a specified format. The reference time for Unix timestamps is 1970-01-01 00:00:00 UTC, and the function generates the corresponding date-time representation based on the input timestamp and format string. When the input timestamp contains a fractional part, the result includes sub-second precision up to microseconds (6 decimal places).

This function is consistent with the [from_unixtime function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_from-unixtime) in MySQL.

## Syntax

```sql
FROM_UNIXTIME(<unix_timestamp> [, <string_format>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<unix_timestamp>` | Input Unix timestamp, of type BIGINT or DECIMAL, representing the number of seconds (with optional fractional seconds) from 1970-01-01 00:00:00 UTC |
| `<string_format>` | Format string, supports varchar and string types, default is %Y-%m-%d %H:%i:%s. For specific formats, please refer to [date-format](./date-format) |

## Return Value

Returns date in specified format, of type VARCHAR, returning the result of converting the UTC timezone unix timestamp to the current timezone time. When the input contains a fractional part, the result includes sub-second precision (e.g., `2007-12-01 00:30:19.500000`).
- Currently supported unix_timestamp range is [0, 253402271999.999999] corresponding to dates from 1970-01-01 00:00:00 to 9999-12-31 23:59:59.999999, unix_timestamp outside this range will return an error
- If string_format is invalid, returns a string that does not meet expectations.
- If any parameter is NULL, returns NULL
- If the format length is over 128 characters, returns error

## Examples

```sql

----Since the current timezone is East 8th zone, the returned time is 8 hours ahead of UTC
select from_unixtime(0);
+---------------------+
| from_unixtime(0)    |
+---------------------+
| 1970-01-01 08:00:00 |
+---------------------+

---Default format %Y-%m-%d %H:%i:%s return
mysql> select from_unixtime(1196440219);
+---------------------------+
| from_unixtime(1196440219) |
+---------------------------+
| 2007-12-01 00:30:19       |
+---------------------------+

---Specify yyyy-MM-dd HH:mm:ss format return
mysql> select from_unixtime(1196440219, 'yyyy-MM-dd HH:mm:ss');
+--------------------------------------------------+
| from_unixtime(1196440219, 'yyyy-MM-dd HH:mm:ss') |
+--------------------------------------------------+
| 2007-12-01 00:30:19                              |
+--------------------------------------------------+


---Specify %Y-%m-%d date-only format return
mysql> select from_unixtime(1196440219, '%Y-%m-%d');
+-----------------------------------------+
| from_unixtime(1196440219, '%Y-%m-%d') |
+-----------------------------------------+
| 2007-12-01                              |
+-----------------------------------------+

---Specify %Y-%m-%d %H:%i:%s format return
mysql> select from_unixtime(1196440219, '%Y-%m-%d %H:%i:%s');
+--------------------------------------------------+
| from_unixtime(1196440219, '%Y-%m-%d %H:%i:%s') |
+--------------------------------------------------+
| 2007-12-01 00:30:19                              |
+--------------------------------------------------+

---Exceeds maximum range, returns error
select from_unixtime(253402281999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation from_unixtime_new of 253402281999, yyyy-MM-dd HH:mm:ss is invalid

---result over max length
select from_unixtime(32536799,repeat('a',129));
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation from_unixtime_new of invalid or oversized format is invalid

---string-format does not reference any time values
mysql> select from_unixtime(32536799,"gdaskpdp");
+------------------------------------+
| from_unixtime(32536799,"gdaskpdp") |
+------------------------------------+
| gdaskpdp                           |
+------------------------------------+

---Fractional timestamp input, result includes sub-second precision
mysql> select from_unixtime(1196440219.5);
+-----------------------------+
| from_unixtime(1196440219.5) |
+-----------------------------+
| 2007-12-01 00:30:19.500000  |
+-----------------------------+

---Fractional timestamp with microsecond precision
mysql> select from_unixtime(1196440219.123456);
+----------------------------------+
| from_unixtime(1196440219.123456) |
+----------------------------------+
| 2007-12-01 00:30:19.123456       |
+----------------------------------+

---Use %f format specifier to display microseconds explicitly
mysql> select from_unixtime(1196440219.123456, '%Y-%m-%d %H:%i:%s.%f');
+----------------------------------------------------------+
| from_unixtime(1196440219.123456, '%Y-%m-%d %H:%i:%s.%f') |
+----------------------------------------------------------+
| 2007-12-01 00:30:19.123456                               |
+----------------------------------------------------------+

---Input is NULL, returns NULL
mysql> select from_unixtime(NULL);
+---------------------+
| from_unixtime(NULL) |
+---------------------+
| NULL                |
+---------------------+

```