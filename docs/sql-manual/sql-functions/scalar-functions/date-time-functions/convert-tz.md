---
{
    "title": "CONVERT_TZ",
    "language": "en"
}
---

## Description

Convert a datetime value from the given time zone from_tz to the given time zone to_tz and return the result. For time zone settings, please refer to the document at [time-zone](../../../../admin-manual/cluster-management/time-zone/)

## Syntax

```sql
CONVERT_TZ(<dt>, <from_tz>, <to_tz>)
```

## Parameter

| Parameter | Description |
| -- | -- | 
| `<dt>` | The value to be converted, which is of `datetime` or `date` type and `string` types that conform to the format, with a maximum precision of six decimal places for seconds (e.g.,2022-12-28 23:59:59.999999) |
| `<from_tz>` | The original time zone of dt, it is `string` type |
| `<to_tz>` | The original time zone of dt,it is `string` type |

## Return value

The converted timestamp value.​
For datetime inputs without scale, the returned result also has no scale; for inputs with scale, the return also has scale.​
Special cases:​
- If the parameters are invalid (such as an invalid datetime format (e.g., 2022-2-32 13:21:03; for specific datetime formats, please refer to [cast to datetime](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [cast to date](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)), a non-existent time zone identifier, etc.), this function returns NULL.
- If any parameter is NULL, returns NULL.
- The time zone range is [-12:00, 14:00]. Returns NULL if outside this range.
## Example


```sql


---Convert time from Shanghai, China to Los Angeles, USA
mysql> select CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATETIME), 'Asia/Shanghai', 'America/Los_Angeles');
+---------------------------------------------------------------------------+
| CONVERT_TZ('2019-08-01 13:21:03', 'Asia/Shanghai', 'America/Los_Angeles') |
+---------------------------------------------------------------------------+
| 2019-07-31 22:21:03                                                       |
+---------------------------------------------------------------------------+

---Convert the time '2019-08-01 13:21:03' in UTC+8 to Los Angeles, USA
select CONVERT_TZ('2019-08-01 13:21:03', '+08:00', 'America/Los_Angeles');

+--------------------------------------------------------------------+
| convert_tz('2019-08-01 13:21:03', '+08:00', 'America/Los_Angeles') |
+--------------------------------------------------------------------+
| 2019-07-31 22:21:03                                                |
+--------------------------------------------------------------------+

---input date type，time part will convert to 00:00:00
mysql> select CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATE), 'Asia/Shanghai', 'America/Los_Angeles');
+-------------------------------------------------------------------------------------------+
| CONVERT_TZ(CAST('2019-08-01 13:21:03' AS DATEV2), 'Asia/Shanghai', 'America/Los_Angeles') |
+-------------------------------------------------------------------------------------------+
| 2019-07-31 09:00:00                                                                       |
+-------------------------------------------------------------------------------------------+

---Convert time is NULL, output NULL

mysql> select CONVERT_TZ(NULL, 'Asia/Shanghai', 'America/New_York');
+-------------------------------------------------------+
| CONVERT_TZ(NULL, 'Asia/Shanghai', 'America/New_York') |
+-------------------------------------------------------+
| NULL                                                  |
+-------------------------------------------------------+

---If any time zone is NULL, return NULL
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


---If any time zone is invalid, return NULL
mysql> SELECT CONVERT_TZ('2038-01-19 03:14:07','GMTaa','MET');
+-------------------------------------------------+
| CONVERT_TZ('2038-01-19 03:14:07','GMTaa','MET') |
+-------------------------------------------------+
| NULL                                            |
+-------------------------------------------------+

---Time with scale
mysql> select CONVERT_TZ('2019-08-01 13:21:03.636', '+08:00', 'America/Los_Angeles');
+------------------------------------------------------------------------+
| CONVERT_TZ('2019-08-01 13:21:03.636', '+08:00', 'America/Los_Angeles') |
+------------------------------------------------------------------------+
| 2019-07-31 22:21:03.636                                                |
+------------------------------------------------------------------------+


---Larer than 9999 year,return NULL
mysql> select CONVERT_TZ('12019-08-01 13:21:03.636', '+08:00', 'America/Los_Angeles');
+-------------------------------------------------------------------------+
| CONVERT_TZ('12019-08-01 13:21:03.636', '+08:00', 'America/Los_Angeles') |
+-------------------------------------------------------------------------+
| NULL                                                                    |
+-------------------------------------------------------------------------+

---The time zone range is [-12:00, 14:00]. Returns NULL if outside this range.
mysql> select CONVERT_TZ('2019-08-01 13:21:03', '+08:00', '+15:00');
+-------------------------------------------------------+
| CONVERT_TZ('2019-08-01 13:21:03', '+08:00', '+15:00') |
+-------------------------------------------------------+
| NULL                                                  |
+-------------------------------------------------------+

```


