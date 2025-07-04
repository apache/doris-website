---
{
"title": "BITXOR",
"language": "en"
}
---

## bitxor
### description
#### Syntax

`BITXOR(Integer-type lhs, Integer-type rhs)`

Returns the result of the XOR operation of two integers.

Integer range: TINYINT、SMALLINT、INT、BIGINT、LARGEINT

### example

```
mysql> select bitxor(3,5) ans;
+------+
| ans  |
+------+
|    7 |
+------+

mysql> select bitxor(1,7) ans;
+------+
| ans  |
+------+
|    6 |
+------+
```

### keywords

    BITXOR
