---
{
    "title": "HEX",
    "language": "en"
}
---

## hex
### description
#### Syntax

`VARCHAR hex(VARCHAR str)`

`VARCHAR hex(BIGINT num)`

If the input parameter is a number, the string representation of the hexadecimal value is returned;

If the input parameter is a string, each character will be converted into two hexadecimal characters, and all the characters after the conversion will be spliced into a string for output


### example

```
input string

mysql> select hex('1');
+----------+
| hex('1') |
+----------+
| 31       |
+----------+

mysql> select hex('@');
+----------+
| hex('@') |
+----------+
| 40       |
+----------+

mysql> select hex('12');
+-----------+
| hex('12') |
+-----------+
| 3132      |
+-----------+
```

```
intput num

mysql> select hex(12);
+---------+
| hex(12) |
+---------+
| C       |
+---------+

mysql> select hex(-1);
+------------------+
| hex(-1)          |
+------------------+
| FFFFFFFFFFFFFFFF |
+------------------+
```
### keywords
    HEX
