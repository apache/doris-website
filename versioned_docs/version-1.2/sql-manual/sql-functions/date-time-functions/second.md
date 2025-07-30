---
{
    "title": "SECOND",
    "language": "en"
}
---

## second
### description
#### Syntax

`INT SECOND(DATETIME date)`

Returns second information in the time type, ranging from 0,59

The parameter is Date or Datetime type

### example

```
mysql> select second('2018-12-31 23:59:59');
+-----------------------------+
| second('2018-12-31 23:59:59') |
+-----------------------------+
|                          59 |
+-----------------------------+
```
### keywords
    SECOND
