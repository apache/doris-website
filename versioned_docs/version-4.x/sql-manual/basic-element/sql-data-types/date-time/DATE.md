---
{
    "title": "DATE | Date Time",
    "language": "en",
    "description": "DATE type stores dates, with a value range of [0000-01-01, 9999-12-31], and the default output format is 'yyyy-MM-dd'.",
    "sidebar_label": "DATE"
}
---

# DATE

## Description

DATE type stores dates, with a value range of `[0000-01-01, 9999-12-31]`, excluding `0000-02-29`. The default output format is 'yyyy-MM-dd'.

Doris uses Gregorian calendar rules, with year `0000` representing 1 BC (BCE 1). The special boundary date `0000-02-29` is unsupported.

Since 4.1.5, Arrow, Parquet, and ORC V2 epoch-day conversion for DATE fixes an offset in the first two months of year zero. Files with the old Doris encoding cannot be identified automatically. For files containing `0000-01-01` through `0000-02-28`, identify the writer and migrate them as described in the [upgrade guide](../../../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration).

DATE type can be used as a primary key, partition column or bucket column. A DATE type field actually occupies 4 bytes in Doris. DATE is stored separately by year、month、day in runtime, so executing `months_add` operation on DATE column is more efficient than `unix_timestamp`.

How to convert other types to DATE, and the input accepted during conversion, see [Cast to DATE](../conversion/date-conversion.md).

Date and time types do not support direct use of mathematical operators for arithmetic operations. The essence of performing mathematical operations is to first implicitly convert the date and time types to numeric types, and then perform the operation. If you need to perform addition, subtraction, or rounding on time types, consider using functions like [DATE_ADD](../../../sql-functions/scalar-functions/date-time-functions/date-add.md), [DATE_SUB](../../../sql-functions/scalar-functions/date-time-functions/date-sub.md), [TIMESTAMPDIFF](../../../sql-functions/scalar-functions/date-time-functions/timestampdiff.md), [DATE_TRUNC](../../../sql-functions/scalar-functions/date-time-functions/date-trunc.md).

DATE type does not store time zone, that is, changes in the session variable `time_zone` do not affect the stored values of DATE type.

## Examples

```sql
select cast('2020-01-02' as date);
```

```text
+----------------------------+
| cast('2020-01-02' as date) |
+----------------------------+
| 2020-01-02                 |
+----------------------------+
```

```sql
select cast('0120-02-29' as date);
```

```text
+----------------------------+
| cast('0120-02-29' as date) |
+----------------------------+
| 0120-02-29                 |
+----------------------------+
```

