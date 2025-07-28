---
{
    "title": "NOW",
    "language": "en"
}
---

## now
### Description
#### Syntax

`DATETIME NOW ()`


Get the current time and return it in Datetime type.

### example

```
mysql> select now();
+---------------------+
| now()               |
+---------------------+
| 2019-05-27 15:58:25 |
+---------------------+
```

`DATETIMEV2 NOW(INT precision)`


Get the current time and return it in DatetimeV2 type.
Precision represents the second precision that the user wants. The current precision supports up to microseconds, that is, the value range of precision is [0, 6].

### example

```
mysql> select now(3);
+-------------------------+
| now(3)                  |
+-------------------------+
| 2022-09-06 16:13:30.078 |
+-------------------------+
```

Note:
1. Currently, only DatetimeV2 type supports precision.
2. Limited by the JDK implementation, if you use jdk8 to build FE, the precision can be up to milliseconds (three decimal places), and the larger precision bits will be filled with 0. If you need higher accuracy, please use jdk11 to build FE.

### keywords
    NOW
