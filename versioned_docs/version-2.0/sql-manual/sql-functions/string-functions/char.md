---
{
    "title": "CHAR",
    "language": "en"
}
---

:::tip Tips
This function is supported since the Apache Doris 1.2.
:::

## function char
### description
#### Syntax

`VARCHAR char(INT,..., [USING charset_name])`

Interprets each argument as an integer and returns a string consisting of the characters given by the code values of those integers. `NULL` values are skipped.

If the result string is illegal for the given character set, the result from `CHAR()` becomes `NULL`.

Arguments larger than `255` are converted into multiple result bytes. For example, `char(15049882)` is equivalent to `char(229, 164, 154)`.

Currently only `utf8` is supported for `charset_name`.


### example

```
mysql> select char(68, 111, 114, 105, 115);
+--------------------------------------+
| char('utf8', 68, 111, 114, 105, 115) |
+--------------------------------------+
| Doris                                |
+--------------------------------------+

mysql> select char(15049882, 15179199, 14989469);
+--------------------------------------------+
| char('utf8', 15049882, 15179199, 14989469) |
+--------------------------------------------+
| 多睿丝                                     |
+--------------------------------------------+

mysql> select char(255);
+-------------------+
| char('utf8', 255) |
+-------------------+
| NULL              |
+-------------------+
```
### keywords
    CHAR
