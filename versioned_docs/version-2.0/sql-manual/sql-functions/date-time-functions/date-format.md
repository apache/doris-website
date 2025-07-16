---
{
    "title": "DATE_FORMAT",
    "language": "en"
}
---

## date_format
### Description
#### Syntax

`VARCHAR DATE_FORMAT (DATETIME DATE, VARCHAR Format)`


Convert the date type to a string according to the format type.
Convert the date type to a string according to the format type. Currently, it supports a maximum of 128 bytes for the string. If the return value length exceeds 128 bytes, then it returns NULL.

The date parameter is the valid date. Format specifies the date/time output format.

The formats available are:

| Format  | Description                                                          |
|---------|----------------------------------------------------------------------|
| %a      | Abbreviated weekday name (Sun..Sat)                                  |
| %b      | Abbreviated month name (Jan..Dec)                                    |
| %c      | Month, numeric (0..12)                                               |
| %D      | Day of the month with English suffix (0th, 1st, 2nd, 3rd, …)         |
| %d      | Day of the month, numeric (00..31)                                   |
| %e      | Day of the month, numeric (0..31)                                    |
| %f      | Microseconds (000000..999999)                                        |
| %H      | Hour (00..23)                                                        |
| %h      | Hour (01..12)                                                        |
| %I      | Hour (01..12)                                                        |
| %i      | Minutes, numeric (00..59)                                            |
| %j      | Day of year (001..366)                                               |
| %k      | Hour (0..23)                                                         |
| %l      | Hour (1..12)                                                         |
| %M      | Month name (January..December)                                       |
| %m      | Month, numeric (00..12)                                              |
| %p      | AM or PM                                                             |
| %r      | Time, 12-hour (hh:mm:ss followed by AM or PM)                        |
| %S      | Seconds (00..59)                                                     |
| %s      | Seconds (00..59)                                                     |
| %T      | Time, 24-hour (hh:mm:ss)                                             |
| %U      | Week (00..53), where Sunday is the first day of the week; [WEEK](./week) mode 0                   |
| %u      | Week (00..53), where Monday is the first day of the week; [WEEK](./week) mode 1                   |
| %V      | Week (01..53), where Sunday is the first day of the week; [WEEK](./week) mode 2; used with %X     |
| %v      | Week (01..53), where Monday is the first day of the week; [WEEK](./week) mode 3; used with %x     |
| %W      | Weekday name (Sunday..Saturday)                                      |
| %w      | Day of the week (0=Sunday..6=Saturday)                               |
| %X      | Year for the week where Sunday is the first day of the week, numeric, four digits; used with %V   |
| %x      | Year for the week, where Monday is the first day of the week, numeric, four digits; used with %v  |
| %Y      | Year, numeric, four digits                                           |
| %y      | Year, numeric (two digits)                                           |
| %%      | A literal % character                                                |
| %**x**  | **x**, for any “**x**” not listed above                              |

Also support 3 formats:

yyyyMMdd

yyyy-MM-dd

yyyy-MM-dd HH:mm:ss

### example

```
mysql> select date_format('2009-10-04 22:23:00', '%W %M %Y');
+------------------------------------------------+
| date_format('2009-10-04 22:23:00', '%W %M %Y') |
+------------------------------------------------+
| Sunday October 2009                            |
+------------------------------------------------+

mysql> select date_format('2007-10-04 22:23:00', '%H:%i:%s');
+------------------------------------------------+
| date_format('2007-10-04 22:23:00', '%H:%i:%s') |
+------------------------------------------------+
| 22:23:00                                       |
+------------------------------------------------+

mysql> select date_format('1900-10-04 22:23:00', '%D %y %a %d %m %b %j');
+------------------------------------------------------------+
| date_format('1900-10-04 22:23:00', '%D %y %a %d %m %b %j') |
+------------------------------------------------------------+
| 4th 00 Thu 04 10 Oct 277                                   |
+------------------------------------------------------------+

mysql> select date_format('1997-10-04 22:23:00', '%H %k %I %r %T %S %w');
+------------------------------------------------------------+
| date_format('1997-10-04 22:23:00', '%H %k %I %r %T %S %w') |
+------------------------------------------------------------+
| 22 22 10 10:23:00 PM 22:23:00 00 6                         |
+------------------------------------------------------------+

mysql> select date_format('1999-01-01 00:00:00', '%X %V'); 
+---------------------------------------------+
| date_format('1999-01-01 00:00:00', '%X %V') |
+---------------------------------------------+
| 1998 52                                     |
+---------------------------------------------+

mysql> select date_format('2006-06-01', '%d');
+------------------------------------------+
| date_format('2006-06-01 00:00:00', '%d') |
+------------------------------------------+
| 01                                       |
+------------------------------------------+

mysql> select date_format('2006-06-01', '%%%d');
+--------------------------------------------+
| date_format('2006-06-01 00:00:00', '%%%d') |
+--------------------------------------------+
| %01                                        |
+--------------------------------------------+
```
### keywords
    DATE_FORMAT,DATE,FORMAT
