---
{
    "title": "LOG",
    "language": "en"
}
---

## log

### description
#### Syntax

`DOUBLE log(DOUBLE b, DOUBLE x)`
Returns the logarithm of `x` based on base `b`.

### example

```
mysql> select log(5,1);
+---------------+
| log(5.0, 1.0) |
+---------------+
|             0 |
+---------------+
mysql> select log(3,20);
+--------------------+
| log(3.0, 20.0)     |
+--------------------+
| 2.7268330278608417 |
+--------------------+
mysql> select log(2,65536);
+-------------------+
| log(2.0, 65536.0) |
+-------------------+
|                16 |
+-------------------+
```

### keywords
	LOG
