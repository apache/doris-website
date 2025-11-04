---
{
    "title": "STR_TO_DATE",
    "language": "en"
}
---

## Description

The function converts the input datetime string into a DATETIME type value based on the specified format.

This function behaves consistently with the [str_to_date function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_str-to-date) in MySQL.

## Syntax

```sql
STR_TO_DATE(<datetime_str>, <format>)
```

## Parameters

| Parameter        | Description                                                                                                                                                                                                                                                                                                      |
|------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<datetime_str>` | Required. The input datetime string representing the date or time to be converted. For supported input formats, see [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<format>`       | Required. The specified datetime format string, such as `%Y-%m-%d %H:%i:%s`, etc. For specific format parameters, see the [DATE_FORMAT](./date-format#parameters) documentation                                                                                                                               |

In addition, `<format>` supports the following alternative formats and interprets them according to the regular format:

| Alternative Input          | Interpreted as       |
|----------------------------|----------------------|
| `yyyyMMdd`                 | `%Y%m%d`             |
| `yyyy-MM-dd`               | `%Y-%m-%d`           |
| `yyyy-MM-dd HH:mm:ss`      | `%Y-%m-%d %H:%i:%s`  |

## Return Value
Returns a DATETIME value representing the converted date and time.

Date and time matching method uses two pointers to point to the start of both strings:
1. When the format string encounters a % symbol, the next letter after % is used to match the corresponding part of the date/time string. If it does not match (e.g., %Y tries to match a time part like 10:10:10, or % is followed by an unsupported character like %*), an error is returned. If matched successfully, move to the next character for parsing.
2. At any time, if either string encounters a space character, skip it and parse the next character.
3. When matching ordinary letters, check if the characters pointed to by both pointers are equal. If not, return an error; if equal, parse the next character.
4. When the date pointer reaches the end of the string, if the date/time only contains the date part, the format string will check whether it contains time part characters (e.g., %H). If so, the time part will be set to 00:00:00.
5. When the format string pointer reaches the end, matching ends.
6. Finally, check whether the matched time parts are valid (e.g., month must be in [1,12]). If invalid, return an error; if valid, return the parsed date and time.

- If any parameter is NULL, returns NULL;
- If `<format>` is an empty string, returns an error;
- If matching fails, returns an error.

## Examples

```sql
-- Parse using standard format specifiers
SELECT STR_TO_DATE('2025-01-23 12:34:56', '%Y-%m-%d %H:%i:%s') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

-- Parse using alternative format
SELECT STR_TO_DATE('2025-01-23 12:34:56', 'yyyy-MM-dd HH:mm:ss') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

-- Date string only (time defaults to 00:00:00)
SELECT STR_TO_DATE('20230713', 'yyyyMMdd') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 00:00:00 |
+---------------------+

-- Parse string with week number and weekday
SELECT STR_TO_DATE('200442 Monday', '%X%V %W') AS result;
+------------+
| result     |
+------------+
| 2004-10-18 |
+------------+

-- Parse abbreviated month name and 12-hour time
SELECT STR_TO_DATE('Oct 5 2023 3:45:00 PM', '%b %d %Y %h:%i:%s %p') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-10-05 15:45:00 |
+---------------------+

-- Format does not match string (returns error)
SELECT STR_TO_DATE('2023/01/01', '%Y-%m-%d') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation str_to_date of 2023/01/01 is invalid

-- String contains extra characters (automatically ignored)
SELECT STR_TO_DATE('2023-01-01 10:00:00 (GMT)', '%Y-%m-%d %H:%i:%s') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 10:00:00 |
+---------------------+

-- Parse microseconds (precision preserved)
SELECT STR_TO_DATE('2023-07-13 12:34:56.789', '%Y-%m-%d %H:%i:%s.%f') AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 12:34:56.789000 |
+----------------------------+

-- Any parameter is NULL (returns NULL)
SELECT STR_TO_DATE(NULL, '%Y-%m-%d'), STR_TO_DATE('2023-01-01', NULL) AS result;
+--------------------------------+--------+
| str_to_date(NULL, '%Y-%m-%d')  | result |
+--------------------------------+--------+
| NULL                           | NULL   |
+--------------------------------+--------+

-- Format is an empty string (returns error)
SELECT STR_TO_DATE('2023-01-01', '') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation str_to_date of 2023-01-01 is invalid
```