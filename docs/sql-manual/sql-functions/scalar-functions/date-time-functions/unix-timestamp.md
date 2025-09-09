---
{
    "title": "UNIX_TIMESTAMP",
    "language": "en"
}
---

## Description

Converts Date or Datetime types to unix timestamps.

If no parameters are provided, the current time is converted to a timestamp.

Parameters must be Date or Datetime type.

For Format specification, please refer to the format description of the date_format function.

This function is affected by time zone, please see [Time Zone Management](../../../../admin-manual/cluster-management/time-zone) for time zone details.

This function behaves consistently with the [unix_timestamp function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_unix-timestamp) in MySQL.

## Syntax

```sql
UNIX_TIMESTAMP()
UNIX_TIMESTAMP(`<date_or_date_expr>`)
UNIX_TIMESTAMP(`<date_or_date_expr>`, `<fmt>`)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<date_or_date_expr>` | Input datetime value, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<fmt>` | The date parameter specifies the specific part to be converted to timestamp, type is string. If this parameter is provided, only the part matching the format will be converted to timestamp. |

## Return Value
Returns two types based on input:

1. If the input date is datetime type with non-zero scale or has format parameter:
   Returns a timestamp of type Decimal, with up to six decimal places precision

2. If the input date has scale 0 and no format parameter:
   Returns a timestamp of type INT

Converts input time to timestamp based on seconds from 1970-01-01 00:00:01.000000 UTC, converted to the timezone of the current machine.
If input includes timezone, returns timestamp based on seconds from 1970-01-01 00:00:01.000000 UTC, converted to the corresponding timezone.
For times before 1970-01-01 00:00:01.000000 UTC, this function returns 0.
You can also control the machine's timezone through the `time_zone` variable.

Returns null if any parameter is null.


## Examples

```sql
-- Current machine timezone is UTC+8 (set time_zone = "+08:00")
mysql> select unix_timestamp('1970-01-01 +08:00');
+------------------------------+
| unix_timestamp('1970-01-01') |
+------------------------------+
|                            0 |
+------------------------------+

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

-- Input with timezone
select unix_timestamp('2007-11-30 10:30:19 +09:00');
+----------------------------------------------+
| unix_timestamp('2007-11-30 10:30:19 +09:00') |
+----------------------------------------------+
|                            1196386219.000000 |
+----------------------------------------------+

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
```
