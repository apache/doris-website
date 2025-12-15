---
{
  "title": "TIMESTAMPADD",
  "language": "en"
}
---

## Description

The `timestampadd` function is used to add a specified time unit (such as year, month, day, hour, minute, second, etc.) to a date. This function is commonly used for date and time calculations.

## Syntax

`TIMESTAMPADD(<unit>, <interval>, <datetime_expr>)`

## Parameters

| Parameter | Description                                                                                                          |
| -- |----------------------------------------------------------------------------------------------------------------------|
| `unit` | Time unit, specifies the time unit to add, common values include SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, YEAR        |
| `interval` | The time interval to add, typically an integer, which can be positive or negative to add or subtract the time length |
| `datetime_expr` | A valid  datetime data type                                                                                          |

## Return Value

The return value is the new date and time, representing the result of adding or subtracting the specified time interval to the given timestamp.

If the input parameters are invalid, `NULL` is returned.

## Examples

```sql
SELECT TIMESTAMPADD(MINUTE,1,'2019-01-02');
```

```text
+------------------------------------------------+
| timestampadd(MINUTE, 1, '2019-01-02 00:00:00') |
+------------------------------------------------+
| 2019-01-02 00:01:00                            |
+------------------------------------------------+
```

```sql
SELECT TIMESTAMPADD(WEEK,1,'2019-01-02');
```

```text
+----------------------------------------------+
| timestampadd(WEEK, 1, '2019-01-02 00:00:00') |
+----------------------------------------------+
| 2019-01-09 00:00:00                          |
+----------------------------------------------+
```

```sql
SELECT TIMESTAMPADD(WEEK,1,'1196440219');
```

```sql
+------------------------------------------------------------+
| timestampadd(WEEK, 1, CAST('1196440219' AS datetimev2(6))) |
+------------------------------------------------------------+
| NULL                                                       |
+------------------------------------------------------------+
```
