---
{
    "title": "HOUR",
    "language": "en"
}
---

## hour
### description
#### Syntax

`INT HOUR(DATETIME date)`

Returns hour information in the time type, ranging from 0,23

The parameter is Date or Datetime type

### example

```
mysql> select hour('2018-12-31 23:59:59');
+-----------------------------+
| hour('2018-12-31 23:59:59') |
+-----------------------------+
|                          23 |
+-----------------------------+
```
### keywords
    HOUR
