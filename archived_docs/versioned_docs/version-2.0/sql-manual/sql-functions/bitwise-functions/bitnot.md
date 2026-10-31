---
{
"title": "BITNOT",
"language": "en"
}
---

## bitnot
### description
#### Syntax

`BITNOT(Integer-type value)`

Returns the result of the NOT operation of one integer.

Integer range: TINYINT、SMALLINT、INT、BIGINT、LARGEINT

### example

```
mysql> select bitnot(7) ans;
+------+
| ans  |
+------+
|   -8 |
+------+

mysql> select bitxor(-127) ans;
+------+
| ans  |
+------+
|  126 |
+------+
```

### keywords

    BITNOT
