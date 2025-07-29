---
{
    "title": "MICROSECOND",
    "language": "en"
}
---

## microsecond
### description
#### Syntax

`INT MICROSECOND(DATETIMEV2 date)`

Returns microsecond information in the time type.

The parameter is Datetime type

### example

```
mysql> select microsecond(cast('1999-01-02 10:11:12.000123' as datetimev2(6))) as microsecond;
+-------------+
| microsecond |
+-------------+
|         123 |
+-------------+
```
### keywords
    MICROSECOND
