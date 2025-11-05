---
{
    "title": "PERIOD_DIFF",
    "language": "en"
}
---

## Description
Calculates the difference in months between two periods.

where `<period>` is an integer, the last two digits represent the month (01-12), and the preceding digits represent the year.
The function returns the absolute result of period_1 - period_2.

If the year part is less than 100, it will be converted to a four-digit year format according to [certain rules](#parameters).

This function behaves consistently with MySQL's [PERIOD_DIFF function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_period-diff).

## Syntax

```sql
PERIOD_DIFF(`<period_1>`, `<period_2>`)
```

## Parameters

| Parameter      | Description                                                                                     |
|----------------|-------------------------------------------------------------------------------------------------|
| `<period_1>`   | represents a period composed of year and month. <ul><li>**Format**: The month occupies the last two digits, which must be within the range `[1, 12]`. The preceding digits represent the year, and the number of digits for the year is unlimited; it can exceed four digits.</li><li>**Year Inference**: The year value is directly taken from all digits except the last two. If the year is a two-digit number (range: [00, 99]), if the year is less than 70, it is interpreted as 20YY; if it is 70 or greater, it is interpreted as 19YY.</li><li>**Value Range**: Accepts integer parameters within the range `[0, 2^63-1]`.</li></ul> |
| `<period_2>`   | Represents another period. The format requirements are the same as `<period_1>`. |

## Return Value

Returns an integer representing the total number of months in `<period_1>` minus the total number of months in `<period_2>`.

If any parameter is NULL, or if the values cannot be converted to BIGINT, the function returns NULL.

If the parameters are negative or their month parts are invalid, the function will throw an error.

## Examples

```sql
SELECT `period_1`, `period_2`, PERIOD_DIFF(`period_1`, `period_2`) AS DIFF FROM `test_period_diff`;
```
```text
+---------------------+----------+---------------------+
| period_1            | period_2 | DIFF                |
+---------------------+----------+---------------------+
| 200802              |   200703 |                  11 |
| 200703              |   200802 |                 -11 |
| 7001                |     6912 |               -1199 |
| NULL                |     2510 |                NULL |
| 2510                |     NULL |                NULL |
| 9223372036854775807 |      101 | 1106804644422549090 |
| 9223372036854775808 |      101 |                NULL |
+---------------------+----------+---------------------+
```
In the last row, `period_1` exceeds the BIGINT upper limit (2^63-1), so the output is NULL.

```sql
SELECT PERIOD_DIFF(1, -1);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Period function got invalid period: -1
```