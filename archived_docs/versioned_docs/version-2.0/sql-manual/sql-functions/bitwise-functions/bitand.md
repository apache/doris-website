---
{
"title": "BITAND",
"language": "en"
}
---

## bitand
### description
#### Syntax

`BITAND(Integer-type lhs, Integer-type rhs)`

Returns the result of the AND operation of two integers.

Integer range: TINYINT、SMALLINT、INT、BIGINT、LARGEINT

### example

```
mysql> select bitand(3,5) ans;
+------+
| ans  |
+------+
|    1 |
+------+

mysql> select bitand(4,7) ans;
+------+
| ans  |
+------+
|    4 |
+------+
```

### keywords

    BITAND
