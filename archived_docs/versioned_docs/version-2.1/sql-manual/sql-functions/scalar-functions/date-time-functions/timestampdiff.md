---
{
    "title": "TIMESTAMPDIFF",
    "language": "en",
    "description": "The timestampdiff function is used to calculate the difference between two dates and returns the time interval between them."
}
---

## Description

The `timestampdiff` function is used to calculate the difference between two  dates and returns the time interval between them. The difference can be returned in the specified time unit (such as seconds, minutes, hours, days, months, years, etc.).

## Syntax

`TIMESTAMPDIFF(<unit>, <datetime_expr1>, <datetime_expr2>)`

## Parameters

| Parameter | Description                                                                                                                  |
| -- |------------------------------------------------------------------------------------------------------------------------------|
| `unit` | Time unit, specifies the unit in which to return the difference, common values include SECOND, MINUTE, HOUR, DAY, MONTH, YEAR |
| `datetime_expr1` | The first datetime, a valid target  date                                                                                     |
| `datetime_expr2` | The second datetime, a valid target  date                                                                        |

## Return Value

The return value is the difference between the two date-times, with the unit determined by the unit parameter.

If the input parameters are invalid, `NULL` is returned.

## Examples

```sql
SELECT TIMESTAMPDIFF(MONTH,'2003-02-01','2003-05-01');
```

```text
+--------------------------------------------------------------------+
| timestampdiff(MONTH, '2003-02-01 00:00:00', '2003-05-01 00:00:00') |
+--------------------------------------------------------------------+
|                                                                  3 |
+--------------------------------------------------------------------+
```

```sql
SELECT TIMESTAMPDIFF(YEAR,'2002-05-01','2001-01-01');
```

```text
+-------------------------------------------------------------------+
| timestampdiff(YEAR, '2002-05-01 00:00:00', '2001-01-01 00:00:00') |
+-------------------------------------------------------------------+
|                                                                -1 |
+-------------------------------------------------------------------+
```

```sql
SELECT TIMESTAMPDIFF(MINUTE,'2003-02-01','2003-05-01 12:05:55');
```

```text
+---------------------------------------------------------------------+
| timestampdiff(MINUTE, '2003-02-01 00:00:00', '2003-05-01 12:05:55') |
+---------------------------------------------------------------------+
|                                                              128885 |
+---------------------------------------------------------------------+
```

```sql
SELECT  TIMESTAMPDIFF(MINUTE,'2003-02-01','1196440219');
```

```text
+-----------------------------------------------------------------------------------+
| timestampdiff(MINUTE, '2003-02-01 00:00:00', CAST('1196440219' AS datetimev2(6))) |
+-----------------------------------------------------------------------------------+
|                                                                              NULL |
+-----------------------------------------------------------------------------------+
```