---
{
    "title": "UNIX_TIMESTAMP",
    "language": "en",
    "description": "Converts DATE, DATETIME, or TIMESTAMP_NS values to Unix timestamps, preserving nine fractional digits for TIMESTAMP_NS input."
}
---

## Description

Converts `DATE`, `DATETIME`, or `TIMESTAMP_NS` values to Unix timestamps.

If no parameters are provided, the current time is converted to a timestamp.

When a date-time argument is provided, it must be `DATE`, `DATETIME`, or `TIMESTAMP_NS`.

For Format specification, please refer to the format description of the date_format function.

This function is affected by time zone, please see [Time Zone Management](../../../../admin-manual/cluster-management/time-zone) for time zone details.

This function is consistent with the [unix_timestamp function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_unix-timestamp) in MySQL.

## Syntax

```sql
UNIX_TIMESTAMP()
UNIX_TIMESTAMP(`<date_or_date_expr>`)
UNIX_TIMESTAMP(`<date_or_date_expr>`, `<fmt>`)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<date_or_date_expr>` | Input date-time value. Supports `DATE`, `DATETIME`, and `TIMESTAMP_NS`. |
| `<fmt>` | The date parameter specifies the specific part to be converted to timestamp, type is string. If this parameter is provided, only the part matching the format will be converted to timestamp. |

## Return Value
The return type depends on the input:

1. A `TIMESTAMP_NS` input returns a `DECIMAL` timestamp with nine fractional digits.
2. A `DATETIME` input with non-zero scale, or a call with `<fmt>`, returns a `DECIMAL` timestamp with up to six fractional digits.
3. A `DATE` or scale-0 `DATETIME` input without `<fmt>` returns an `INT` timestamp.

Converts the input time to the corresponding timestamp, with the epoch time being 1970-01-01 00:00:00.

- Returns null if any parameter is null.
- Returns an error if format is invalid

## Examples

```sql
-- Input datetime is the begin datetime
mysql> select unix_timestamp('1970-01-01 00:00:00');
+---------------------------------------+
| unix_timestamp('1970-01-01 00:00:00') |
+---------------------------------------+
|                                     0 |
+---------------------------------------+

-- Display timestamp of current time
mysql> select unix_timestamp();
+------------------+
| unix_timestamp() |
+------------------+
|       1753933330 |
+------------------+

-- Input a datetime to display its timestamp
mysql> select unix_timestamp('2007-11-30 10:30:19');
+---------------------------------------+
| unix_timestamp('2007-11-30 10:30:19') |
+---------------------------------------+
|                            1196389819 |
+---------------------------------------+


-- Match format to display timestamp for given datetime
mysql> select unix_timestamp('2007-11-30 10:30-19', '%Y-%m-%d %H:%i-%s');
+------------------------------------------------------------+
| unix_timestamp('2007-11-30 10:30-19', '%Y-%m-%d %H:%i-%s') |
+------------------------------------------------------------+
|                                          1196389819.000000 |
+------------------------------------------------------------+

-- Input with non-zero scale
mysql> SELECT UNIX_TIMESTAMP('2015-11-13 10:20:19.123');
+-------------------------------------------+
| UNIX_TIMESTAMP('2015-11-13 10:20:19.123') |
+-------------------------------------------+
|                            1447381219.123 |
+-------------------------------------------+

-- For datetime before 1970-01-01, returns 0
select unix_timestamp('1007-11-30 10:30:19');
+---------------------------------------+
| unix_timestamp('1007-11-30 10:30:19') |
+---------------------------------------+
|                                     0 |
+---------------------------------------+

-- Returns NULL if any parameter is null
mysql> select unix_timestamp(NULL);
+----------------------+
| unix_timestamp(NULL) |
+----------------------+
|                 NULL |
+----------------------+

-- Returns an error if format is invalid
mysql> select unix_timestamp('2007-11-30 10:30-19', 's');
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation unix_timestamp of 2007-11-30 10:30-19, s is invalid
```
