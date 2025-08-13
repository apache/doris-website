---
{
    "title": "DATE_SUB",
    "language": "en"
}
---

## Descirption

The DATE_SUB function is used to subtract a specified time interval from a given date or time value and return the calculated date or time result. It supports operations on DATE (date only) and DATETIME (date and time) types, where the time interval is defined by both a numerical value and a unit.

## Aliases

- days_sub
- date_sub
- subdate

## Syntax

```sql
DATE_ADD(<date>, <expr> <time_unit>)
```

## Parameter

| Parameter | Descirption |
| -- | -- |
| `<date>` | A valid date value, support `datetime` or `date` type and `string` types that conform to the format, for specific datetime formats, please refer to [cast to datetime](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [cast to date](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion))|
| `<expr>` | The time interval to be subtracted, of type INT |
| `<time_unit>` | Enumerated values: YEAR, QUARTER, MONTH, DAY, HOUR, MINUTE, SECOND, WEEK|

## Return value

Returns a calculated result with the same type as `date`:

- When input is DATE, returns DATE (date part only);
- When input is DATETIME, returns DATETIME (including date and time).
- For datetime types with scale, they will be rounded to seconds; for string types with scale, they will be returned with the scale retained.

Special cases:

- Returns NULL if any parameter is NULL;
- Returns NULL for illegal `expr` (negative values) or `time_unit`;
- Returns NULL if the calculated result is earlier than the minimum value supported by the date type (e.g., before '0000-01-01').

## Example

```sql


--- Subtract two days
mysql> select date_sub(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY);

+-------------------------------------------------------------------+
| date_sub(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY) |
+-------------------------------------------------------------------+
| 2010-11-28 23:59:59                                               |
+-------------------------------------------------------------------+


---For datetime type parameters with scale, round to seconds
mysql> select date_sub(cast('2010-11-30 23:59:59.6' as datetime), INTERVAL 4 SECOND);
+------------------------------------------------------------------------+
| date_sub(cast('2010-11-30 23:59:59.6' as datetime), INTERVAL 4 SECOND) |
+------------------------------------------------------------------------+
| 2010-11-30 23:59:56                                                    |
+------------------------------------------------------------------------+

---For string type parameters with scale, return with scale retained
mysql> select date_sub('2010-11-30 23:59:59.6', INTERVAL 4 SECOND);
+------------------------------------------------------+
| date_sub('2010-11-30 23:59:59.6', INTERVAL 4 SECOND) |
+------------------------------------------------------+
| 2010-11-30 23:59:55.6                                |
+------------------------------------------------------+

--- Subtract two months across years
mysql> select date_sub(cast('2023-01-15' as date), INTERVAL 2 MONTH);
+--------------------------------------------------------+
| date_sub(cast('2023-01-15' as date), INTERVAL 2 MONTH) |
+--------------------------------------------------------+
| 2022-11-15                                             |
+--------------------------------------------------------+

--- February 2023 has only 28 days, so subtracting one month from 2023-03-31 results in 2023-02-28
mysql> select date_sub('2023-03-31', INTERVAL 1 MONTH);
+------------------------------------------+
| date_sub('2023-03-31', INTERVAL 1 MONTH) |
+------------------------------------------+
| 2023-02-28                               |
+------------------------------------------+

--- Subtract 61 seconds
mysql> select date_sub('2023-12-31 23:59:59', INTERVAL 61 SECOND);
+-----------------------------------------------------+
| date_sub('2023-12-31 23:59:59', INTERVAL 61 SECOND) |
+-----------------------------------------------------+
| 2023-12-31 23:58:58                                 |
+-----------------------------------------------------+

--- Subtract quarters

mysql> select date_sub('2023-12-31 23:59:59', INTERVAL 61 QUARTER);
+------------------------------------------------------+
| date_sub('2023-12-31 23:59:59', INTERVAL 61 QUARTER) |
+------------------------------------------------------+
| 2008-09-30 23:59:59                                  |
+------------------------------------------------------+

--- Any parameter is NULL
mysql> select date_sub('2023-01-01', INTERVAL NULL DAY);
+-------------------------------------------+
| date_sub('2023-01-01', INTERVAL NULL DAY) |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+


--- Exceeds minimum date
mysql> select date_sub('0000-01-01', INTERVAL 1 DAY);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation days_sub of 0000-01-01, 1 out of range

select date_sub('9999-01-01', INTERVAL -1 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation years_sub of 9999-01-01, -1 out of range
```