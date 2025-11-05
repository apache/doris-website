---
{
    "title": "HOURS_ADD",
    "language": "en"
}
---

## Description

The HOURS_ADD function adds or subtracts a specified number of hours to/from an input date or datetime value and returns the calculated new datetime. This function supports both DATE and DATETIME input types. If the input is DATE type (containing only year, month, day), it defaults the time part to 00:00:00 before adding hours.

This function is consistent with the [date_add function](./date-add) and [date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add) in MySQL when using the `HOUR` unit.

## Syntax

```sql
HOURS_ADD(`<date_or_time_expr>`, `<hours>`)
```

## Parameters

| Parameter | Description |
| ---- | ---- |
| `<date_or_time_expr>` | A valid date expression that supports date/datetime types. For specific datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<hours>` | The number of hours to add, of integer (INT) type. Can be positive or negative: positive number adds the specified hours, negative number subtracts the specified hours (equivalent to subtracting hours) |

## Return Value

Returns DATETIME type, representing the time value after adding or subtracting the specified number of hours from the input datetime.

- If the calculation result exceeds the valid range of DATETIME type [0000-01-01 00:00:01, 9999-12-31 23:59:59], returns an error.
- Return NULL if any parameters is NULL.

## Examples

```sql

-- Add hours to datetime type
SELECT HOURS_ADD('2020-02-02 02:02:02', 1);
+------------------------------------------------------------+
| hours_add(cast('2020-02-02 02:02:02' as DATETIMEV2(0)), 1) |
+------------------------------------------------------------+
| 2020-02-02 03:02:02                                        |
+------------------------------------------------------------+

-- Add hours to date type (default time is 00:00:00)
SELECT HOURS_ADD('2020-02-02', 51);
+-----------------------------+
| HOURS_ADD('2020-02-02', 51) |
+-----------------------------+
| 2020-02-04 03:00:00         |
+-----------------------------+

-- Add negative hours (i.e., subtract hours)
select hours_add('2023-10-01 10:00:00', -3) ;
+--------------------------------------+
| hours_add('2023-10-01 10:00:00', -3) |
+--------------------------------------+
| 2023-10-01 07:00:00                  |
+--------------------------------------+

-- Input parameter is NULL, return NULL
select hours_add(null, 5) ;
+--------------------+
| hours_add(null, 5) |
+--------------------+
| NULL               |
+--------------------+

select hours_add('2023-10-01 10:00:00',NULL) ;
+---------------------------------------+
| hours_add('2023-10-01 10:00:00',NULL) |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+

-- Exceeds datetime range
select hours_add('9999-12-31 23:59:59', 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 9999-12-31 23:59:59, 2 out of range

mysql> select hours_add('0000-01-01',-2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 0000-01-01 00:00:00, -2 out of range
```
