---
{
    "title": "TIME_FORMAT",
    "language": "en"
}
---

## Description

The TIME_FORMAT function is used to convert a time value into a string according to the specified format string. It supports formatting for TIME and DATETIME types, and the output is a string that conforms to the format requirements.

This function behaves consistently with the [time_format function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_time-format) in MySQL.

## Syntax

```sql
TIME_FORMAT(<time_or_datetime_expr>, <format>)
```

## Parameters

| Parameter                 | Description                                                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<time_or_datetime_expr>` | A valid time value, supporting TIME or DATETIME types.                                                                                                     |
| `<format>`                | Specifies the output format for the time, as a `varchar` type. If the format string contains date or non-compliant format specifiers, it will return NULL. |

Supported format specifiers:

| Specifier | Description                                   |
| --------- | --------------------------------------------- |
| %f        | Microseconds (000000-999999)                  |
| %H        | Hour (00-23)                                  |
| %h        | Hour (01-12)                                  |
| %I        | Hour (01-12)                                  |
| %i        | Minutes, numeric (00-59)                      |
| %k        | Hour (0-23)                                   |
| %l        | Hour (1-12)                                   |
| %p        | AM or PM                                      |
| %r        | Time, 12-hour (hh:mm:ss followed by AM or PM) |
| %S        | Seconds (00-59)                               |
| %s        | Seconds (00-59)                               |
| %T        | Time, 24-hour (hh:mm:ss)                      |
| %%        | Represents a literal % character              |

## Return Value

A formatted time string, of type Varchar.

Special cases:
- If `time_or_datetime_expr` or `format` is NULL, it returns NULL.
- If the `format` string contains date format specifiers:
    - `%Y`: return `0000`.
    - `%y`, `%m`, `%d`: return `00`.
    - `%c`, `%e`: return `0`.
    - Other date format specifiers (`%a`, `%b`, `%D`, `%j`, `%M`, `%u`, `%U`, `%v`, `%V`, `%w`, `%W`, `%x`, `%X`): return NULL.
- If the time value contains an hour part greater than 23, the `%H` and `%k` format specifiers will produce a value larger than 23. Other hour format specifiers will produce the hour value modulo 12.

## Examples

```sql
SELECT * FROM test_time_format;
```
```text
+------+-------------------+
| id   | tm                |
+------+-------------------+
|    1 | 00:00:00          |
|    2 | 00:00:00.123456   |
|    3 | 12:34:56          |
|    4 | 12:34:56.789012   |
|    5 | 23:59:59          |
|    6 | 23:59:59.999999   |
|    7 | 08:00:00          |
|    8 | 15:00:00          |
|    9 | 100:00:00         |
|   10 | 123:45:56         |
|   11 | 838:59:59.999999  |
|   12 | -00:00:01         |
|   13 | -12:34:56.000001  |
|   14 | -838:59:59.999999 |
+------+-------------------+
```

```sql
SELECT
    id,
    tm,
    TIME_FORMAT(tm, '%H') AS '%H',
    TIME_FORMAT(tm, '%k') AS '%k',
    TIME_FORMAT(tm, '%h') AS '%h',
    TIME_FORMAT(tm, '%I') AS '%I',
    TIME_FORMAT(tm, '%l') AS '%l',
    TIME_FORMAT(tm, '%i') AS '%i',
    TIME_FORMAT(tm, '%s') AS '%s',
    TIME_FORMAT(tm, '%S') AS '%S',
    TIME_FORMAT(tm, '%f') AS '%f',
    TIME_FORMAT(tm, '%p') AS '%p',
    TIME_FORMAT(tm, '%r') AS '%r',
    TIME_FORMAT(tm, '%T') AS '%T',
    TIME_FORMAT(tm, '%H:%i:%s.%f') AS '%H:%i:%s.%f',
    TIME_FORMAT(tm, '%k %H %l %I %h') AS '%k %H %l %I %h',
    TIME_FORMAT(tm, '%T %r %h:%I') AS '%T %r %h:%I',
    TIME_FORMAT(tm, '%l %k %I %H %h %p') AS '%l %k %I %H %h %p',
    TIME_FORMAT(tm, '%f %s %i %T %r') AS '%f %s %i %T %r'
FROM test_time_format
ORDER BY id;
```
```text
+------+-------------------+------+------+------+------+------+------+------+------+---------+------+--------------+-----------+------------------+-----------------+-----------------------------+--------------------+------------------------------------+
| id   | tm                | %H   | %k   | %h   | %I   | %l   | %i   | %s   | %S   | %f      | %p   | %r           | %T        | %H:%i:%s.%f      | %k %H %l %I %h  | %T %r %h:%I                 | %l %k %I %H %h %p  | %f %s %i %T %r                     |
+------+-------------------+------+------+------+------+------+------+------+------+---------+------+--------------+-----------+------------------+-----------------+-----------------------------+--------------------+------------------------------------+
|    1 | 00:00:00          | 00   | 0    | 12   | 12   | 12   | 00   | 00   | 00   | 000000  | AM   | 12:00:00 AM  | 00:00:00  | 00:00:00.000000  | 0 00 12 12 12   | 00:00:00 12:00:00 AM 12:12  | 12 0 12 00 12 AM   | 000000 00 00 00:00:00 12:00:00 AM  |
|    2 | 00:00:00.123456   | 00   | 0    | 12   | 12   | 12   | 00   | 00   | 00   | 123456  | AM   | 12:00:00 AM  | 00:00:00  | 00:00:00.123456  | 0 00 12 12 12   | 00:00:00 12:00:00 AM 12:12  | 12 0 12 00 12 AM   | 123456 00 00 00:00:00 12:00:00 AM  |
|    3 | 12:34:56          | 12   | 12   | 12   | 12   | 12   | 34   | 56   | 56   | 000000  | PM   | 12:34:56 PM  | 12:34:56  | 12:34:56.000000  | 12 12 12 12 12  | 12:34:56 12:34:56 PM 12:12  | 12 12 12 12 12 PM  | 000000 56 34 12:34:56 12:34:56 PM  |
|    4 | 12:34:56.789012   | 12   | 12   | 12   | 12   | 12   | 34   | 56   | 56   | 789012  | PM   | 12:34:56 PM  | 12:34:56  | 12:34:56.789012  | 12 12 12 12 12  | 12:34:56 12:34:56 PM 12:12  | 12 12 12 12 12 PM  | 789012 56 34 12:34:56 12:34:56 PM  |
|    5 | 23:59:59          | 23   | 23   | 11   | 11   | 11   | 59   | 59   | 59   | 000000  | PM   | 11:59:59 PM  | 23:59:59  | 23:59:59.000000  | 23 23 11 11 11  | 23:59:59 11:59:59 PM 11:11  | 11 23 11 23 11 PM  | 000000 59 59 23:59:59 11:59:59 PM  |
|    6 | 23:59:59.999999   | 23   | 23   | 11   | 11   | 11   | 59   | 59   | 59   | 999999  | PM   | 11:59:59 PM  | 23:59:59  | 23:59:59.999999  | 23 23 11 11 11  | 23:59:59 11:59:59 PM 11:11  | 11 23 11 23 11 PM  | 999999 59 59 23:59:59 11:59:59 PM  |
|    7 | 08:00:00          | 08   | 8    | 08   | 08   | 8    | 00   | 00   | 00   | 000000  | AM   | 08:00:00 AM  | 08:00:00  | 08:00:00.000000  | 8 08 8 08 08    | 08:00:00 08:00:00 AM 08:08  | 8 8 08 08 08 AM    | 000000 00 00 08:00:00 08:00:00 AM  |
|    8 | 15:00:00          | 15   | 15   | 03   | 03   | 3    | 00   | 00   | 00   | 000000  | PM   | 03:00:00 PM  | 15:00:00  | 15:00:00.000000  | 15 15 3 03 03   | 15:00:00 03:00:00 PM 03:03  | 3 15 03 15 03 PM   | 000000 00 00 15:00:00 03:00:00 PM  |
|    9 | 100:00:00         | 100  | 100  | 04   | 04   | 4    | 00   | 00   | 00   | 000000  | AM   | 04:00:00 AM  | 100:00:00 | 100:00:00.000000 | 100 100 4 04 04 | 100:00:00 04:00:00 AM 04:04 | 4 100 04 100 04 AM | 000000 00 00 100:00:00 04:00:00 AM |
|   10 | 123:45:56         | 123  | 123  | 03   | 03   | 3    | 45   | 56   | 56   | 000000  | AM   | 03:45:56 AM  | 123:45:56 | 123:45:56.000000 | 123 123 3 03 03 | 123:45:56 03:45:56 AM 03:03 | 3 123 03 123 03 AM | 000000 56 45 123:45:56 03:45:56 AM |
|   11 | 838:59:59.999999  | NULL | NULL | NULL | NULL | NULL | NULL | NULL | NULL | NULL    | NULL | NULL         | NULL      | NULL             | NULL            | NULL                        | NULL               | NULL                               |
|   12 | -00:00:01         | -00  | -0   | -12  | -12  | -12  | -00  | -01  | -01  | -000000 | -AM  | -12:00:01 AM | -00:00:01 | -00:00:01.000000 | -0 00 12 12 12  | -00:00:01 12:00:01 AM 12:12 | -12 0 12 00 12 AM  | -000000 01 00 00:00:01 12:00:01 AM |
|   13 | -12:34:56.000001  | -12  | -12  | -12  | -12  | -12  | -34  | -56  | -56  | -000001 | -PM  | -12:34:56 PM | -12:34:56 | -12:34:56.000001 | -12 12 12 12 12 | -12:34:56 12:34:56 PM 12:12 | -12 12 12 12 12 PM | -000001 56 34 12:34:56 12:34:56 PM |
|   14 | -838:59:59.999999 | NULL | NULL | NULL | NULL | NULL | NULL | NULL | NULL | NULL    | NULL | NULL         | NULL      | NULL             | NULL            | NULL                        | NULL               | NULL                               |
+------+-------------------+------+------+------+------+------+------+------+------+---------+------+--------------+-----------+------------------+-----------------+-----------------------------+--------------------+------------------------------------+
```
> Note: For the parameters `838:59:59.999999` and `-838:59:59.999999`, since they exceed the TIME range [-838:59:59, 838:59:59], they cannot be converted to the TIME type, and thus the returned result is NULL.
```

```sql
-- Placeholder for %Y, %y, %m, %d, %c, %e returns the corresponding number of digits 0
SELECT fmt, TIME_FORMAT('12:13:14.123456', fmt) AS res FROM test_format;
```
```text
+------+------+
| fmt  | res  |
+------+------+
| %Y   | 0000 |
| %y   | 00   |
| %m   | 00   |
| %d   | 00   |
| %c   | 0    |
| %e   | 0    |
+------+------+
```

```sql
-- Other placeholders (`%D`, `%j`, `%M`, `%u`, `%U`, `%v`, `%V`, `%w`, `%W`, `%x`, `%X`) return NULL.
SELECT TIME_FORMAT('11:22:33', '%h:%i:%s, %j');
```
```sql
+-----------------------------------------+
| TIME_FORMAT('11:22:33', '%h:%i:%s, %j') |
+-----------------------------------------+
| NULL                                    |
+-----------------------------------------+
```

```sql
-- If any parameter is NULL, then return NULL
SELECT TIME_FORMAT('12:34:56', NULL);
```
```text
+-------------------------------+
| TIME_FORMAT('12:34:56', NULL) |
+-------------------------------+
| NULL                          |
+-------------------------------+
```