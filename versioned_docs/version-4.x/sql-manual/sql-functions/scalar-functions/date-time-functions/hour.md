---
{
    "title": "HOUR",
    "language": "en",
    "description": "The HOUR function extracts the hour part from a datetime or time expression. This function supports multiple time type inputs,"
}
---

## Description

The HOUR function extracts the hour part from a datetime or time expression. This function supports multiple time type inputs, including DATE/DATETIME and TIME, and returns the corresponding hour value.

For DATETIME (such as '2023-10-01 14:30:00'), the return value ranges from 0-23 (24-hour format).
For TIME type (such as '456:26:32'), the return value can exceed 24, ranging from [0,838].

This function behaves consistently with the [hour function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_hour) in MySQL.

## Syntax

```sql
HOUR(`<date_or_time_expr>`)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date_or_time_expr>` | A valid date expression that supports datetime/date/time types. Date type will be converted to the start time 00:00:00 of the corresponding date. For specific datetime/date/time formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion), and [time conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion) |

## Return Value

Returns an integer type (INT) representing the hour part of the input expression.
- For DATETIME, returns an integer from 0-23.
- For DATE type, returns 0.
- For TIME type, returns an integer from 0 to 838 (consistent with the TIME type range), it return tht absolute value.
- If the input parameter is NULL, returns NULL.

## Examples

```sql
-- Extract hour from datetime (24-hour format)
select 
    hour('2018-12-31 23:59:59') as last_hour,
    hour('2023-01-01 00:00:00') as midnight,   
    hour('2023-10-01 12:30:45') as noon;     

+-----------+----------+------+
| last_hour | midnight | noon |
+-----------+----------+------+
|        23 |        0 |   12 |
+-----------+----------+------+

-- Extract hour from TIME type (supports over 24 or negative values)
select 
    hour(cast('14:30:00' as time)) as normal_hour,     
    hour(cast('25:00:00' as time)) as over_24,
    hour(cast('456:26:32' as time)) as large_hour,     
    hour(cast('-12:30:00' as time)) as negative_hour, 
    hour(cast('838:59:59' as time)) as max_hour,    
    hour(cast('-838:59:59' as time)) as min_hour;    

+-------------+---------+------------+---------------+----------+----------+
| normal_hour | over_24 | large_hour | negative_hour | max_hour | min_hour |
+-------------+---------+------------+---------------+----------+----------+
|          14 |      25 |        456 |            12 |      838 |      838 |
+-------------+---------+------------+---------------+----------+----------+

-- Extract hour from date type, returns 0
select hour("2022-12-12");
+--------------------+
| hour("2022-12-12") |
+--------------------+
|                  0 |
+--------------------+

-- Will not automatically convert input time string to time, returns NULL
select hour('14:30:00') as normal_hour;
+-------------+
| normal_hour |
+-------------+
|        NULL |
+-------------+

-- Input parameter is NULL, returns NULL
mysql> select hour(NULL);
+------------+
| hour(NULL) |
+------------+
|       NULL |
+------------+
```

