---
{
    "title": "DATETIME",
    "language": "en",
    "description": "The DATETIME(p) type stores date and time, where p is the precision, with the range of values for p being [0, 6], and the default value is 0. That is,"
}
---

## Description

The DATETIME(p) type stores date and time, where p is the precision, with the range of values for p being `[0, 6]`, and the default value is 0. That is, DATETIME is equivalent to DATETIME(0).

The range is `[0000-01-01 00:00:00.000..., 9999-12-31 23:59:59.999...]`, and the default output format is 'yyyy-MM-dd HH:mm:ss.SSS...'. There are a total of p digits after the decimal point. For example, the range of DATETIME(6) is `[0000-01-01 00:00:00.000000, 9999-12-31 23:59:59.999999]`.

Doris uses the Gregorian calendar date format, and the dates existing in the Gregorian calendar correspond one by one to the dates existing in Doris, where `0000` represents 1 BC (BCE 1). No matter which day the date is on, the time range is always `['00:00:00.000...', '23:59:59.999...']`, and there are no duplicate times, i.e., no leap seconds.

DATETIME type can be used as a primary key, partition column or bucket column. A DATETIME type field actually occupies 8 bytes in Doris. DATETIME is stored separately by year, month, day, hour, minute, second and microsecond in runtime, so executing `months_add` operation on DATETIME column is more efficient than `unix_timestamp`.

How to convert other types to DATETIME, and the input accepted during conversion, see [Cast to DATETIME](../conversion/datetime-conversion.md).

Date and time types do not support direct use of mathematical operators for arithmetic operations. The essence of performing mathematical operations is to first implicitly convert the date and time types to numeric types, and then perform the operation. If you need to perform addition, subtraction, or rounding on time types, consider using functions like [DATE_ADD](../../../sql-functions/scalar-functions/date-time-functions/date-add.md), [DATE_SUB](../../../sql-functions/scalar-functions/date-time-functions/date-sub.md), [TIMESTAMPDIFF](../../../sql-functions/scalar-functions/date-time-functions/timestampdiff.md), [DATE_TRUNC](../../../sql-functions/scalar-functions/date-time-functions/date-trunc.md).

DATETIME type does not store time zone, that is, changes in the session variable `time_zone` do not affect the stored values of DATETIME type.

## Examples

```sql
select cast('2020-01-02' as datetime);
```

```text
+--------------------------------+
| cast('2020-01-02' as datetime) |
+--------------------------------+
| 2020-01-02 00:00:00            |
+--------------------------------+
```

```sql
select cast('2020-01-02' as datetime(6));
```

```text
+-----------------------------------+
| cast('2020-01-02' as datetime(6)) |
+-----------------------------------+
| 2020-01-02 00:00:00.000000        |
+-----------------------------------+
```

```sql
select cast('0000-12-31 22:21:20.123456' as datetime(4));
```

```text
+---------------------------------------------------+
| cast('0000-12-31 22:21:20.123456' as datetime(4)) |
+---------------------------------------------------+
| 0000-12-31 22:21:20.1235                          |
+---------------------------------------------------+
```
