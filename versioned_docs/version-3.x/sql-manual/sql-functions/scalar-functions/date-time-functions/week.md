---
{
    "title": "WEEK",
    "language": "en",
    "description": "Returns the week number for date.The value of the mode argument defaults to 0. The following table describes how the mode argument works."
}
---

## week
### Description
#### Syntax

`INT WEEK(DATE date[, INT mode])`

Returns the week number for date.The value of the mode argument defaults to 0.
The following table describes how the mode argument works.

|Mode |First day of week |Range  |Week 1 is the first week …    |
|:----|:-----------------|:------|:-----------------------------|
|0    |Sunday            |0-53   |with a Sunday in this year    |
|1    |Monday            |0-53   |with 4 or more days this year |
|2    |Sunday            |1-53   |with a Sunday in this year    |
|3    |Monday            |1-53   |with 4 or more days this year |
|4    |Sunday            |0-53   |with 4 or more days this year |
|5    |Monday            |0-53   |with a Monday in this year    |
|6    |Sunday            |1-53   |with 4 or more days this year |
|7    |Monday            |1-53   |with a Monday in this year    |

The parameter is Date or Datetime type

### example
```
mysql> select week('2020-1-1');
+------------------+
| week('2020-1-1') |
+------------------+
|                0 |
+------------------+
```
```
mysql> select week('2020-7-1',1);
+---------------------+
| week('2020-7-1', 1) |
+---------------------+
|                  27 |
+---------------------+
```
### keywords
    WEEK
