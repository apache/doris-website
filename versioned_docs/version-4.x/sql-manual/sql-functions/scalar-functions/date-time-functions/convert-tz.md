---
{
    "title": "CONVERT_TZ",
    "language": "en",
    "description": "Convert a datetime value from the given time zone fromtz to the given time zone totz and return the result. For time zone settings,"
}
---

## Description

Convert a datetime value from the given time zone from_tz to the given time zone to_tz and return the result. For time zone settings, please refer to the [Time Zone Management](../../../../admin-manual/cluster-management/time-zone) documentation.

This function is consistent with the [convert_tz function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_convert_tz) in MySQL.

## Syntax

```sql
CONVERT_TZ(<dt>, <from_tz>, <to_tz>)
```

## Parameters

| Parameter | Description |
| -- | -- | 
| `<dt>` | The value to be converted, which is of datetime or date type. For specific datetime and date formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<from_tz>` | The original time zone of dt, this parameter is of `varchar` type |
| `<to_tz>` | The target time zone to convert to, this parameter is of `varchar` type |

## Return Value

- The converted value type of datetime
- The returned scale is the same as the input scale
  - For datetime input without scale, the returned result also has no scale
  - For input with scale, the returned result has the same scale

Special cases:
- If any parameter is NULL, returns NULL.
- When the input time zone is invalid, returns error. For time zone settings, refer to [Time Zone Management](../../../../admin-manual/cluster-management/time-zone).
- For date type input, the time part is automatically converted to 00:00:00

## Examples


```sql
-- Convert time from Shanghai, China to Los Angeles, USA
mysql> select CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATETIME), 'Asia/Shanghai', 'America/Los_Angeles');
+---------------------------------------------------------------------------+
| CONVERT_TZ('2019-08-01 13:21:03', 'Asia/Shanghai', 'America/Los_Angeles') |
+---------------------------------------------------------------------------+
| 2019-07-31 22:21:03                                                       |
+---------------------------------------------------------------------------+

-- Convert the time '2019-08-01 13:21:03' in UTC+8 (+08:00) to Los Angeles, USA
mysql> select CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATETIME), '+08:00', 'America/Los_Angeles');

+--------------------------------------------------------------------+
| convert_tz('2019-08-01 13:21:03', '+08:00', 'America/Los_Angeles') |
+--------------------------------------------------------------------+
| 2019-07-31 22:21:03                                                |
+--------------------------------------------------------------------+

-- For date type input,return datetime type value, the time part is automatically converted to 00:00:00
mysql> select CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATE), 'Asia/Shanghai', 'America/Los_Angeles');
+-------------------------------------------------------------------------------------------+
| CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATEV2), 'Asia/Shanghai', 'America/Los_Angeles') |
+-------------------------------------------------------------------------------------------+
| 2019-07-31 09:00:00                                                                       |
+-------------------------------------------------------------------------------------------+

-- When conversion time is NULL, output NULL
mysql> select CONVERT_TZ(NULL, 'Asia/Shanghai', 'America/New_York');
+-------------------------------------------------------+
| CONVERT_TZ(NULL, 'Asia/Shanghai', 'America/New_York') |
+-------------------------------------------------------+
| NULL                                                  |
+-------------------------------------------------------+

-- When any time zone is NULL, return NULL
mysql> select CONVERT_TZ('2019-08-01 13:21:03', NULL, 'America/Los_Angeles');
+----------------------------------------------------------------+
| CONVERT_TZ('2019-08-01 13:21:03', NULL, 'America/Los_Angeles') |
+----------------------------------------------------------------+
| NULL                                                           |
+----------------------------------------------------------------+

mysql> select CONVERT_TZ('2019-08-01 13:21:03', '+08:00', NULL);
+---------------------------------------------------+
| CONVERT_TZ('2019-08-01 13:21:03', '+08:00', NULL) |
+---------------------------------------------------+
| NULL                                              |
+---------------------------------------------------+

-- Time with scale
mysql> select CONVERT_TZ('2019-08-01 13:21:03.636', '+08:00', 'America/Los_Angeles');
+------------------------------------------------------------------------+
| CONVERT_TZ('2019-08-01 13:21:03.636', '+08:00', 'America/Los_Angeles') |
+------------------------------------------------------------------------+
| 2019-07-31 22:21:03.636                                                |
+------------------------------------------------------------------------+

-- When the input time zone is invalid, an error is returned.
select CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATETIME), '+08:00', 'America/Los_Anges');
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT][E33] Operation convert_tz invalid timezone: America/Los_Anges
```


