---
{
    "title": "YEAR",
    "language": "en",
    "description": "Returns the year part of the date type, ranging from 1000 to 9999"
}
---

## year
### Description
#### Syntax

`INT YEAR(DATETIME date)`


Returns the year part of the date type, ranging from 1000 to 9999

The parameter is Date or Datetime type

### example

```
mysql> select year('1987-01-01');
+-----------------------------+
| year('1987-01-01 00:00:00') |
+-----------------------------+
|                        1987 |
+-----------------------------+
```
### keywords
    YEAR
