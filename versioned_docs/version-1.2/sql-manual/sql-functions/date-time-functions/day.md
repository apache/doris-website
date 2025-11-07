---
{
    "title": "DAY",
    "language": "en"
}
---

## day
### Description
#### Syntax

`INT DAY(DATETIME date)`


Get the day information in the date, and return values range from 1 to 31.

The parameter is Date or Datetime type

### example

```
mysql> select day('1987-01-31');
+----------------------------+
| day('1987-01-31 00:00:00') |
+----------------------------+
|                         31 |
+----------------------------+
```
### keywords
    DAY
