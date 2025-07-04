---
{
    "title": "LAST_DAY",
    "language": "en"
}
---

## last_day
### Description
#### Syntax

`DATE last_day(DATETIME date)`

Return the last day of the month, the return day may be :
'28'(February and not a leap year), 
'29'(February and a leap year),
'30'(April, June, September, November),
'31'(January, March, May, July, August, October, December)

### example

```
mysql > select last_day('2000-02-03');
+-------------------+
| last_day('2000-02-03 00:00:00') |
+-------------------+
| 2000-02-29        |
+-------------------+
```

### keywords
    LAST_DAY,DAYS
