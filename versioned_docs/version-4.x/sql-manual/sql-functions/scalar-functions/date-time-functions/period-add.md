---
{
    "title": "PERIOD_ADD",
    "language": "en",
    "description": "Calculate the result of increasing the <period> by <month> months."
}
---

## Description
Calculate the result of increasing the `<period>` by `<month>` months.

The `<period>` is an integer, the last two digits represent the month (01-12), and the preceding digits represent the year.
The function returns the calculated period in the format of an integer (year + month).

If the year part is less than 100, it will be processed into a four-digit year format according to [certain rules](#parameters).
For example: PERIOD_ADD(2501, 0) will return 202501, not 2501.

This function behaves consistently with MySQL's [PERIOD_ADD function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_period-add).

## Syntax

```sql
PERIOD_ADD(`<period>`, `month`)
```

## Parameters

| Parameter  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<period>` | represents a period composed of year and month. <ul><li>**Format**: The month occupies the last two digits, which must be within the range `[1, 12]`. The preceding digits represent the year, and the number of digits for the year is unlimited; it can exceed four digits.</li><li>**Year Inference**: The year value is directly taken from all digits except the last two. If the year is a two-digit number (range: [00, 99]), if the year is less than 70, it is interpreted as 20YY; if it is 70 or greater, it is interpreted as 19YY.</li><li>**Value Range**: Accepts integer parameters within the range `[0, 2^63-1]`.</li></ul> |
| `<month>`  | The number of months to add to `<period>`. Accepts integer values in the range `[-2^63, 2^63-1]`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Return Value

Returns an integer representing the calculated period in YYYYMM format. As noted in the parameter description, the year part is not limited to four digits.

If any parameter is NULL, or if the `period` parameter cannot be converted to BIGINT, the function returns NULL.

If the `period` parameter is negative or its month part is invalid, the function will throw an error.

## Examples

```sql
SELECT `period`, `month`, PERIOD_ADD(`period`, `month`) AS ans FROM test_period_add;
```
```text
+----------+--------+----------+
| period   | month  | ans      |
+----------+--------+----------+
|   200803 |      2 |   200805 |
|   200809 |      5 |   200902 |
|      803 |      2 |   200805 |
|     6910 |      3 |   207001 |
|     7001 |      1 |   197002 |
| 12345611 | 123456 | 13374411 |
|     NULL |     10 |     NULL |
|   202510 |   NULL |     NULL |
+----------+--------+----------+
```

```sql
-- Month part exceeds the range [1, 12]
SELECT PERIOD_ADD(202513, 1);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Period function got invalid period: 202513

-- Period exceeds BIGINT range
SELECT PERIOD_ADD(-1, 1);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Period function got invalid period: -1
```

```sql
SELECT PERIOD_ADD(9223372036854775807, 1);
```
```text
+------------------------------------+
| PERIOD_ADD(9223372036854775807, 1) |
+------------------------------------+
|               -9223372036854775808 |
+------------------------------------+
```
Explanation: Doris uses int64_t for internal calculations, so overflow may occur. This behavior is consistent with MySQL.