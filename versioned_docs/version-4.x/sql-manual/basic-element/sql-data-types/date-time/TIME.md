---
{
    "title": "TIME | Date Time",
    "language": "en",
    "description": "The TIME(p) type stores time, where p is the precision, with the range of values for p being [0, 6], and the default value is 0. That is,"
}
---

## Description

The TIME(p) type stores time, where p is the precision, with the range of values for p being `[0, 6]`, and the default value is 0. That is, TIME is equivalent to TIME(0).

The range is `[-838:59:59.999..., 838:59:59.999...]`, and the default output format is 'HH:mm:ss.SSS...' There are a total of p digits after the decimal point. For example, the range of TIME(6) is `[-838:59:59.999999, 838:59:59.999999]`。

The TIME type only appears as an intermediate calculation value, can be input and output, but **does not** support being stored as a column in OLAP tables.

How to convert other types to TIME, and the input accepted during conversion, see [Cast to TIME](../conversion/time-conversion.md).

Date and time types do not support direct use of mathematical operators for arithmetic operations. The essence of performing mathematical operations is to first implicitly convert the date and time types to numeric types, and then perform the operation.

## Examples

```sql
select cast('-123:00:02.9' as time);
```

```text
+------------------------------+
| cast('-123:00:02.9' as time) |
+------------------------------+
| -123:00:03                   |
+------------------------------+
```

```sql
select cast('838:59:59.999999' as time(6));
```

```text
+-------------------------------------+
| cast('838:59:59.999999' as time(6)) |
+-------------------------------------+
| 838:59:59.999999                    |
+-------------------------------------+
```

