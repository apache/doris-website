---
{
    "title": "YEARWEEK",
    "language": "en",
    "description": "Returns year and week for a date.The value of the mode argument defaults to 0. When the week of the date belongs to the previous year,"
}
---

## yearweek
### Description
#### Syntax

`INT YEARWEEK(DATE date[, INT mode])`

Returns year and week for a date.The value of the mode argument defaults to 0.
When the week of the date belongs to the previous year, the year and week of the previous year are returned; 
when the week of the date belongs to the next year, the year of the next year is returned and the week is 1.

The following table describes how the mode argument works.

|Mode |First day of week |Range   |Week 1 is the first week …    |
|:----|:-----------------|:-------|:-----------------------------|
|0    |Sunday            |1-53    |with a Sunday in this year    |
|1    |Monday            |1-53    |with 4 or more days this year |
|2    |Sunday            |1-53    |with a Sunday in this year    |
|3    |Monday            |1-53    |with 4 or more days this year |
|4    |Sunday            |1-53    |with 4 or more days this year |
|5    |Monday            |1-53    |with a Monday in this year    |
|6    |Sunday            |1-53    |with 4 or more days this year |
|7    |Monday            |1-53    |with a Monday in this year    |

The parameter is Date or Datetime type

### example
```
mysql> select yearweek('2021-1-1');
+----------------------+
| yearweek('2021-1-1') |
+----------------------+
|               202052 |
+----------------------+
```
```
mysql> select yearweek('2020-7-1');
+----------------------+
| yearweek('2020-7-1') |
+----------------------+
|               202026 |
+----------------------+
```
```
mysql> select yearweek('2024-12-30',1);
+------------------------------------+
| yearweek('2024-12-30 00:00:00', 1) |
+------------------------------------+
|                             202501 |
+------------------------------------+
```

### keywords
    YEARWEEK
