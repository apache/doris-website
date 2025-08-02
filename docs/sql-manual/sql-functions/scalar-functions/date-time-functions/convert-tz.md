---
{
    "title": "CONVERT_TZ",
    "language": "en"
}
---

## Description

Converts a datetime value from the time zone specified by from_tz to the time zone specified by to_tz and returns the resulting value. For time zone settings, refer to the time-zone documentation.

## Syntax

```sql
CONVERT_TZ(<dt>, <from_tz>, <to_tz>)
```

## Parameter

| Parameter | Description |
| -- | -- | 
| `<dt>` | The value to be converted, which is of `datetime` or date type, with a maximum precision of six decimal places for seconds (e.g., 23:59:59.999999) |
| `<from_tz>` | The original time zone of dt, it is `string` type |
| `<to_tz>` | The original time zone of dt,it is `string` type |

## Return value

The converted timestamp value.​
For datetime inputs without scale, the returned result also has no scale; for inputs with scale, the return also has no scale.​
Special cases:​
- If any parameter is invalid (e.g., invalid datetime format, non-existent time zone identifier, etc.), the function returns NULL.​
- If any parameter is NULL, returns NULL.
## Example


```sql


---Convert time from Shanghai, China to Los Angeles, USA
mysql> select CONVERT_TZ('2019-08-01 13:21:03', 'Asia/Shanghai', 'America/Los_Angeles');
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

---Invalid time format, return NULL
mysql> select CONVERT_TZ('2019-08|*aa01 1', '+08:00', 'America/Los_Angeles');
+----------------------------------------------------------------+
| CONVERT_TZ('2019-08|*aa01 1', '+08:00', 'America/Los_Angeles') |
+----------------------------------------------------------------+
| NULL                                                           |
+----------------------------------------------------------------+

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

```


