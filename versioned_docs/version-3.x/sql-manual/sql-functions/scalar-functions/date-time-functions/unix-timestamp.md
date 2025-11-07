---
{
    "title": "UNIX_TIMESTAMP",
    "language": "en"
}
---

## Description

Converts a Date or Datetime type to a UNIX timestamp.

If no argument is provided, it converts the current time to a timestamp.

The argument must be of Date or Datetime type.

For the format specification, refer to the format description of the date_format function.

This function is affected by the time zone.

## Sytax

```sql
UNIX_TIMESTAMP([DATETIME date[, STRING fmt]])

```

## Parameter

| Paramters | Description |
| -- | -- | 
| `<date>` | The datetime value to be converted is of type `datetime` or `date` type, convertible range: '1970-01-01 00:00:01.000000 UTC' to '3001-01-19 03:14:07.999999 UTC'.|
| `<fmt>` | The 'date' parameter refers to the specific part that needs to be converted into a timestamp, and it is a parameter of type string. If this parameter is provided, only the part matching the format will be converted into a timestamp. |

## Return value

Returns two types based on the input:

- If the input `date`(only `datetime` type have the scale not zero) scale is not 0 or a format parameter is provided,
returns a timestamp of type Decimal with a maximum precision of six decimal places.
- If the input datetime scale is 0 and no format parameter is provided,
returns a timestamp of type INT.

- Supported input range is from '1970-01-01 00:00:01.000000 UTC' to '3001-01-19 03:14:07.999999 UTC'. Times earlier than the minimum return 0; times after the maximum return 0.

Returns NULL if any argument is NULL.

## Examples

```sql

-- All the following results are returned in the UTC time zone

set time_zone= 'UTC';

------Displays the timestamp of the current time
mysql> select unix_timestamp();
+------------------+
| unix_timestamp() |
+------------------+
|       1753933330 |
+------------------+

---Input a datetime to display its timestamp
mysql> select unix_timestamp('2007-11-30 10:30:19');
+---------------------------------------+
| unix_timestamp('2007-11-30 10:30:19') |
+---------------------------------------+
|                            1196389819 |
+---------------------------------------+

---Matches the format to display the timestamp corresponding to the given datetime
mysql> select unix_timestamp('2007-11-30 10:30-19', '%Y-%m-%d %H:%i-%s');
+------------------------------------------------------------+
| unix_timestamp('2007-11-30 10:30-19', '%Y-%m-%d %H:%i-%s') |
+------------------------------------------------------------+
|                                          1196389819.000000 |
+------------------------------------------------------------+


---Only matches year, month, and day to display the timestamp
mysql> select unix_timestamp('2007-11-30 10:30%3A19', '%Y-%m-%d');
+-----------------------------------------------------+
| unix_timestamp('2007-11-30 10:30%3A19', '%Y-%m-%d') |
+-----------------------------------------------------+
|                                   1196352000.000000 |
+-----------------------------------------------------+


---Matching with other characters
mysql> select unix_timestamp('2007-11-30 10:30%3A19', '%Y-%m-%d %H:%i%%3A%s');
+-----------------------------------------------------------------+
| unix_timestamp('2007-11-30 10:30%3A19', '%Y-%m-%d %H:%i%%3A%s') |
+-----------------------------------------------------------------+
|                                               1196389819.000000 |
+-----------------------------------------------------------------+


---Time beyond the minimum range returns 0
mysql> SELECT UNIX_TIMESTAMP('1970-01-01 00:00:00');
+---------------------------------------+
| UNIX_TIMESTAMP('1970-01-01 00:00:00') |
+---------------------------------------+
|                                     0 |
+---------------------------------------+


---Input time with non-zero scale
mysql> SELECT UNIX_TIMESTAMP('2015-11-13 10:20:19.123');
+-------------------------------------------+
| UNIX_TIMESTAMP('2015-11-13 10:20:19.123') |
+-------------------------------------------+
|                            1447381219.123 |
+-------------------------------------------+

---Exceeding the maximum allowed range

mysql> SELECT UNIX_TIMESTAMP('3001-01-19 03:14:07.999999');
+----------------------------------------------+
| UNIX_TIMESTAMP('3001-01-19 03:14:07.999999') |
+----------------------------------------------+
|                                     0.000000 |
+----------------------------------------------+


---Returns NULL if any argument is NULL
mysql> select unix_timestamp(NULL);
+----------------------+
| unix_timestamp(NULL) |
+----------------------+
|                 NULL |
+----------------------+

mysql> select unix_timestamp('2038-01-19 11:14:08',null);
+--------------------------------------------+
| unix_timestamp('2038-01-19 11:14:08',null) |
+--------------------------------------------+
|                                       NULL |
+--------------------------------------------+

```

### keywords

    UNIX_TIMESTAMP,UNIX,TIMESTAMP
