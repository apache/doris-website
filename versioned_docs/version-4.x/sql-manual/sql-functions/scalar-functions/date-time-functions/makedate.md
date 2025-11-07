---
{
    "title": "MAKEDATE",
    "language": "en"
}
---

## Description

The MAKEDATE function is used to construct and return a date based on the specified year and the day of the year (`dayofyear`). The function calculates the result by adding the day offset to the first day of the specified year. It supports automatic adjustment for inputs that exceed the total number of days in the year.

This function behaves the same as MySQL’s [makedate function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_makedate).

## Syntax

```sql
MAKEDATE(`<year>`, `<day_of_year>`)
```

## Parameters

| Parameter    | Description                                                                 |
|--------------|-----------------------------------------------------------------------------|
| `year`       | The specified year, of type INT, with a valid range of 0 to 9999.          |
| `dayofyear`  | The day of the year (1-366), of type INT.                                  |

## Return Value

Returns a value of type `DATE`, representing the date calculated based on the input year and day of the year (format `YYYY-MM-DD`).

- If `<day_of_year>` is less than or equal to 0, an error is returned.
- If `<day_of_year>` exceeds the total number of days in the specified year (365 days for a common year, 366 days for a leap year), the function automatically adjusts to the next year or later years (e.g., the 366th day of 2021, a common year, will be adjusted to 2022-01-01).
- If the calculated result exceeds the valid date range (0000-01-01 to 9999-12-31), an error is returned.
- If any parameter is `NULL`, the function returns `NULL`.

## Examples

```sql
--- Calculate the Nth day of the year (Note: 2021 is a common year with 365 days, and the 365th day is December 31)
SELECT MAKEDATE(2021, 1), MAKEDATE(2021, 100), MAKEDATE(2021, 365);
+-------------------+---------------------+----------------------+
| makedate(2021, 1) | makedate(2021, 100) | makedate(2021, 365)  |
+-------------------+---------------------+----------------------+
| 2021-01-01        | 2021-04-10          | 2021-12-31           |
+-------------------+---------------------+----------------------+

--- Leap year handling: 2020 is a leap year (366 days)
SELECT MAKEDATE(2020, 366);
+----------------------+
| makedate(2020, 366)  |
+----------------------+
| 2020-12-31           |
+----------------------+

--- Days exceeding the total days of the year are automatically adjusted to the next year
SELECT MAKEDATE(2021, 366), MAKEDATE(2021, 400);
+----------------------+----------------------+
| makedate(2021, 366)  | makedate(2021, 400)  |
+----------------------+----------------------+
| 2022-01-01           | 2022-02-04           |
+----------------------+----------------------+

--- Non-positive day values return an error
SELECT MAKEDATE(2020, 0);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]The function makedate Argument value 2020, 0 must larger than zero ,and year between 1 and 9999

--- Parameters are NULL, returns NULL
SELECT MAKEDATE(NULL, 100), MAKEDATE(2023, NULL);
+---------------------+----------------------+
| makedate(NULL, 100) | makedate(2023, NULL) |
+---------------------+----------------------+
| NULL                | NULL                 |
+---------------------+----------------------+

--- Year exceeds the valid range
SELECT MAKEDATE(9999, 366);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation makedate of 9999, 366 out of range
```