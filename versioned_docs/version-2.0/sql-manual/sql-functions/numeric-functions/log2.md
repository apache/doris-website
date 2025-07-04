---
{
    "title": "LOG2",
    "language": "en"
}
---

## log2

### description
#### Syntax

`DOUBLE log2(DOUBLE x)`
Returns the natural logarithm of `x` to base `2`.

### example

```
mysql> select log2(1);
+-----------+
| log2(1.0) |
+-----------+
|         0 |
+-----------+
mysql> select log2(2);
+-----------+
| log2(2.0) |
+-----------+
|         1 |
+-----------+
mysql> select log2(10);
+--------------------+
| log2(10.0)         |
+--------------------+
| 3.3219280948873622 |
+--------------------+
```

### keywords
	LOG2
