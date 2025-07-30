---
{
    "title": "MINUTE",
    "language": "en"
}
---

## minute
### description
#### Syntax

`INT MINUTE(DATETIME date)`

Returns minute information in the time type, ranging from 0,59

The parameter is Date or Datetime type

### example

```
mysql> select minute('2018-12-31 23:59:59');
+-----------------------------+
| minute('2018-12-31 23:59:59') |
+-----------------------------+
|                          59 |
+-----------------------------+
```
### keywords
    MINUTE
