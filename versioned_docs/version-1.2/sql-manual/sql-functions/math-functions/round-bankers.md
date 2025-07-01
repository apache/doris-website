---
{
    "title": "ROUND_BANKERS",
    "language": "en"
}
---

## round_bankers

### description
#### Syntax

`T round_bankers(T x[, d])`
Rounds the argument `x` to `d` specified decimal places. `d` defaults to 0 if not specified. If d is negative, the left d digits of the decimal point are 0. If x or d is null, null is returned.

+ If the rounding number is halfway between two numbers, the function uses banker’s rounding.
+ In other cases, the function rounds numbers to the nearest integer.



### example

```
mysql> select round_bankers(0.4);
+--------------------+
| round_bankers(0.4) |
+--------------------+
|                  0 |
+--------------------+
mysql> select round_bankers(-3.5);
+---------------------+
| round_bankers(-3.5) |
+---------------------+
|                  -4 |
+---------------------+
mysql> select round_bankers(-3.4);
+---------------------+
| round_bankers(-3.4) |
+---------------------+
|                  -3 |
+---------------------+
mysql> select round_bankers(10.755, 2);
+--------------------------+
| round_bankers(10.755, 2) |
+--------------------------+
|                    10.76 |
+--------------------------+
mysql> select round_bankers(1667.2725, 2);
+-----------------------------+
| round_bankers(1667.2725, 2) |
+-----------------------------+
|                     1667.27 |
+-----------------------------+
mysql> select round_bankers(1667.2725, -2);
+------------------------------+
| round_bankers(1667.2725, -2) |
+------------------------------+
|                         1700 |
+------------------------------+
```

### keywords
	round_bankers
