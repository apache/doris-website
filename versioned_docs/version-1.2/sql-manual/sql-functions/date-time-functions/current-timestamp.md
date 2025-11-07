---
{
    "title": "CURRENT_TIMESTAMP",
    "language": "en"
}
---

## current_timestamp
### Description
#### Syntax

`DATETIME CURRENT_TIMESTAMP()`


Get the current time and return it in Datetime type

### example

```
mysql> select current_timestamp();
+---------------------+
| current_timestamp() |
+---------------------+
| 2019-05-27 15:59:33 |
+---------------------+
```

`DATETIMEV2 NOW(INT precision)`


Get the current time and return it in DatetimeV2 type.
Precision represents the second precision that the user wants. The current precision supports up to microseconds, that is, the value range of precision is [0, 6].

### example

```
mysql> select current_timestamp(3);
+-------------------------+
| current_timestamp(3)    |
+-------------------------+
| 2022-09-06 16:18:00.922 |
+-------------------------+
```

Note:
1. Currently, only DatetimeV2 type supports precision.
2. Limited by the JDK implementation, if you use jdk8 to build FE, the precision can be up to milliseconds (three decimal places), and the larger precision bits will be filled with 0. If you need higher accuracy, please use jdk11 to build FE.

### keywords
    CURRENT_TIMESTAMP,CURRENT,TIMESTAMP
