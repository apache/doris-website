---
{
    "title": "PERIOD_ADD",
    "language": "en"
}
---

## Description
Adds `<month>` months to the `<period>` (formatted as YYYYMM or YYMM) and returns the result in YYYYMM format.

This function behaves consistently with MySQL's [PERIOD_ADD function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_period-add).

## Syntax

```sql
PERIOD_ADD(`<period>`, `month`)
```

## Parameters

| Parameter  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<period>` | Represents a period consisting of a year and a month. <ul><li>**Format**: The last two digits represent the month, interpreted as YYYYMM or YYMM. If the YYMM format is used, YY values less than 70 are interpreted as 20YY, and YY values greater than or equal to 70 are interpreted as 19YY.</li><li>**Value Range**: Accepts integer values in the range `[0, 2^63-1]`, and the last two digits (month) must be within `[1, 12]`.</li><li>**Year Digits**: The function does not restrict the number of digits in the year, meaning the year can exceed four digits.</li></ul> |
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