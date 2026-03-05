---
{
    "title": "TRUNCATE",
    "language": "en"
}
---

## truncate

### description
#### Syntax

`DOUBLE truncate(DOUBLE x, INT d)`
Numerically truncate `x` according to the number of decimal places `d`.

The rules are as follows: 
When `d > 0`: keep `d` decimal places of `x` 
When `d = 0`: remove the fractional part of `x` and keep only the integer part 
When `d < 0`: Remove the fractional part of `x`, and replace the integer part with the number `0` according to the number of digits specified by `d`

### example

```
mysql> select truncate(124.3867, 2);
+-----------------------+
| truncate(124.3867, 2) |
+-----------------------+
|                124.38 |
+-----------------------+
mysql> select truncate(124.3867, 0);
+-----------------------+
| truncate(124.3867, 0) |
+-----------------------+
|                   124 |
+-----------------------+
mysql> select truncate(-124.3867, -2);
+-------------------------+
| truncate(-124.3867, -2) |
+-------------------------+
|                    -100 |
+-------------------------+
```

### keywords
	TRUNCATE
