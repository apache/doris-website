---
{
    "title": "UNIX_TIMESTAMP",
    "language": "en"
}
---

## unix_timestamp
### Description
#### Syntax

`INT UNIX_TIMESTAMP([DATETIME date[, STRING fmt]])`

`DECIMAL UNIX_TIMESTAMP([DATETIME date[, STRING fmt]])`

Converting a Date or Datetime type to a UNIX timestamp.

If there are no parameters, the current time is converted into a timestamp.

The parameter needs to be Date or Datetime type.

Any date before 1970-01-01 00:00:00 or after 2038-01-19 03:14:07 will return 0.

See `date_format` function to get Format explanation.

This function is affected by time zone.


## Return Value
Returns two types based on the input:

If the input `datetime` and non-zero scale
Returns a timestamp of type Decimal, maximum six decimal places of precision
If the input `datetime` and zeo scale
Returns a timestamp of type `INT`.
### example

```
mysql> select unix_timestamp();
+------------------+
| unix_timestamp() |
+------------------+
|       1558589570 |
+------------------+

mysql> select unix_timestamp('2007-11-30 10:30:19');
+---------------------------------------+
| unix_timestamp('2007-11-30 10:30:19') |
+---------------------------------------+
|                            1196389819 |
+---------------------------------------+

mysql> select unix_timestamp('2007-11-30 10:30-19', '%Y-%m-%d %H:%i-%s');
+---------------------------------------+
| unix_timestamp('2007-11-30 10:30-19') |
+---------------------------------------+
|                            1196389819 |
+---------------------------------------+

mysql> select unix_timestamp('2007-11-30 10:30%3A19', '%Y-%m-%d %H:%i%%3A%s');
+---------------------------------------+
| unix_timestamp('2007-11-30 10:30%3A19') |
+---------------------------------------+
|                            1196389819 |
+---------------------------------------+

mysql> select unix_timestamp('1969-01-01 00:00:00');
+---------------------------------------+
| unix_timestamp('1969-01-01 00:00:00') |
+---------------------------------------+
|                                     0 |
+---------------------------------------+
```

Input with non-zero scale

```
mysql> SELECT UNIX_TIMESTAMP('2015-11-13 10:20:19.123');
+-------------------------------------------+
| UNIX_TIMESTAMP('2015-11-13 10:20:19.123') |
+-------------------------------------------+
|                            1447381219.123 |
+-------------------------------------------+
```

### keywords

    UNIX_TIMESTAMP,UNIX,TIMESTAMP
