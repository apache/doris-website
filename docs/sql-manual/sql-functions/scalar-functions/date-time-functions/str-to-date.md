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

Returns a DATETIME type value representing the converted datetime.

Datetime matching method uses two pointers pointing to the starting positions of both strings:
1. When the format string encounters the % symbol, it matches the corresponding time part of the time string according to the letter following %. If it doesn't match (such as %Y matching datetime part but it's 10:10:10, or % with unsupported parsing characters like %*), returns NULL. If successful, moves to parse the next character.
2. At any moment when either string encounters a space character, it directly skips to parse the next character
3. When encountering ordinary letter matching, check if the characters pointed to by both string pointers are equal. If not equal, return NULL; if equal, parse the next character
4. When any date pointer points to the end of the string, if the datetime only contains the date part, the format string will check if it contains characters matching the time part (such as %H). If it does, the time part will be set to 00:00:00.
5. When the format string pointer reaches the end, matching ends.
6. Finally check if the matched time parts are valid (such as month must be within [1,12] range). If invalid, return NULL; if valid, return the parsed datetime.

- If `<datetime_str>` doesn't match `<format>` (e.g., string is 2023/13/01 but format is %Y-%m-%d), returns NULL
- If any parameter is NULL, returns NULL
- If `<format>` is an empty string, returns NULL
- If `<datetime_str>` lacks time part (only date), the time part defaults to 00:00:00 after parsing; if it lacks date part (only time), the date part defaults to 0000-00-00 (invalid date, returns NULL)

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

-- Time string only (date invalid, returns empty string)
SELECT STR_TO_DATE('15:30:45', '%H:%i:%s') AS result;
+--------+
| result |
+--------+
|        |
+--------+

-- Parse string with week day and week number
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

-- Format doesn't match string (returns NULL)
SELECT STR_TO_DATE('2023/01/01', '%Y-%m-%d') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- String contains extra characters (automatically ignored)
SELECT STR_TO_DATE('2023-01-01 10:00:00 (GMT)', '%Y-%m-%d %H:%i:%s') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 10:00:00 |
+---------------------+

-- Parse microseconds (preserving precision)
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

-- Format is empty string (returns NULL)
SELECT STR_TO_DATE('2023-01-01', '') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```