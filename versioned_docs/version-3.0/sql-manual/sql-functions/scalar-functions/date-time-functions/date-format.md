---
{
    "title": "DATE_FORMAT",
    "language": "en"
}
---

## Description

The DATE_FORMAT function is used to convert a date or time value into a string according to a specified format string (<format>). It supports formatting DATE (date only) and DATETIME (date and time) types, and the output result is a string that conforms to the specified format.

## Syntax

```sql
DATE_FORMAT(<date>, <format>)
```

## Parameter

| Parameter | Description |
| -- | -- |
| `<date>` | A valid date value, supporting date and datetime types|
| `<format>` | Specifies the output format of the date/time, of type varchar |

Supported Format Specifiers

| Format Specifier | 	Description                               |
|--------|-------------------------------------|
| %a     | Abbreviated weekday name (3 letters)                          |
| %b     | Abbreviated month name (3 letters)                           |
| %c     | Month as a numeric value (0-12)                           |
| %D     | Day of the month with an English suffix (0th, 1st, 2nd, 3rd, …) |
| %d     | Day of the month as a numeric value (00-31)                |
| %e     | Day of the month as a numeric value (0-31)                 |
| %f     | Microseconds (000000-999999)               |
| %H     | Hour (00-23)                        |
| %h     | Hour (01-12)                        |
| %I     | Hour (01-12)                        |
| %i     | Minut as a Numeric value (00-59)                  |
| %j     | Day of year (001-366)                    |
| %k     | Hour (0-23)                         |
| %l     | Hour (1-12)                         |
| %M     | Month name                                |
| %m     | Month as a numeric value  (00-12)                    |
| %p     | AM or PM                            |
| %r     | Time in 12-hour format (hh:mm:ss followed by AM or PM) |
| %S     | Seconds (00-59)                          |
| %s     | Seconds (00-59)                          |
| %T     | Time in 24-hour format (hh:mm:ss)           |
| %U     | Week (00-53), where Sunday is the first day of the week    |
| %u     | Week (00-53), where Monday is the first day of the week    |
| %V     | Week (01-53), where Sunday is the first day of the week; used with %X |
| %v     | Week (01-53), where Monday is the first day of the week; used with %x |
| %W     | Full weekday name (Sunday-Saturday)    |
| %w     | Day of the week (0 = Sunday, 6 = Saturday)        |
| %X     | Year, where Sunday is the first day of the week (4 digits); used with %V |
| %x     | Year, where Monday is the first day of the week (4 digits); used with %v |
| %Y     | Year (4 digits)                            |
| %y     | Year (2 digits)                            |
| %%     | Represents the % character                         |
| %**x** | For any x not listed above, represents x itself |

Three special formats are also available:

```text
yyyyMMdd
yyyy-MM-dd
yyyy-MM-dd HH:mm:ss
```

## Return value

A formatted date string.

Special cases:

- Returns NULL if the input date is invalid (e.g., '2023-13-01').
- Returns NULL if <format> is NULL or an empty string.
- Returns NULL if any parameter is NULL.

## Example

```sql
-- Output weekday name, month name, and 4-digit year
select date_format('2009-10-04 22:23:00', '%W %M %Y');

+------------------------------------------------+
| date_format('2009-10-04 22:23:00', '%W %M %Y') |
+------------------------------------------------+
| Sunday October 2009                            |
+------------------------------------------------+

-- Output time in 24-hour format (hour:minute:second)
select date_format('2007-10-04 22:23:00', '%H:%i:%s');

+------------------------------------------------+
| date_format('2007-10-04 22:23:00', '%H:%i:%s') |
+------------------------------------------------+
| 22:23:00                                       |
+------------------------------------------------+

-- Combine multiple format specifiers and plain characters
select date_format('1900-10-04 22:23:00', 'Day: %D, Year: %y, Month: %b, DayOfYear: %j');

+-----------------------------------------------------------------------------------+
| date_format('1900-10-04 22:23:00', 'Day: %D, Year: %y, Month: %b, DayOfYear: %j') |
+-----------------------------------------------------------------------------------+
| Day: 4th, Year: 00, Month: Oct, DayOfYear: 277                                    |
+-----------------------------------------------------------------------------------+

-- %X (year) used with %V (week number), where Sunday is the first day of the week
select date_format('1999-01-01 00:00:00', '%X-%V');

+---------------------------------------------+
| date_format('1999-01-01 00:00:00', '%X-%V') |
+---------------------------------------------+
| 1998-52                                     |
+---------------------------------------------+

-- Output the % character (escaped with %%)
select date_format('2006-06-01', '%%%d/%m');

+--------------------------------------+
| date_format('2006-06-01', '%%%d/%m') |
+--------------------------------------+
| %01/06                               |
+--------------------------------------+

--- Special format yyyy-MM-dd HH:mm:ss
select date_format('2023-12-31 23:59:59', 'yyyy-MM-dd HH:mm:ss');
+-----------------------------------------------------------+
| date_format('2023-12-31 23:59:59', 'yyyy-MM-dd HH:mm:ss') |
+-----------------------------------------------------------+
| 2023-12-31 23:59:59                                       |
+-----------------------------------------------------------+

--- Special format yyyyMMdd
select date_format('2023-12-31 23:59:59', 'yyyyMMdd');
+------------------------------------------------+
| date_format('2023-12-31 23:59:59', 'yyyyMMdd') |
+------------------------------------------------+
| 20231231                                       |
+------------------------------------------------+

--- Special format yyyy-MM-dd
select date_format('2023-12-31 23:59:59', 'yyyy-MM-dd');
+--------------------------------------------------+
| date_format('2023-12-31 23:59:59', 'yyyy-MM-dd') |
+--------------------------------------------------+
| 2023-12-31                                       |
+--------------------------------------------------+

--- Parameter is null
mysql> select date_format(NULL, '%Y-%m-%d');
+-------------------------------+
| date_format(NULL, '%Y-%m-%d') |
+-------------------------------+
| NULL                          |
+-------------------------------+

--- Invalid datetime

mysql> select date_format('2023-12-32 23:59:59', 'yyyy-MM-dd');
+--------------------------------------------------+
| date_format('2023-12-32 23:59:59', 'yyyy-MM-dd') |
+--------------------------------------------------+
| NULL                                             |
+--------------------------------------------------+
```
