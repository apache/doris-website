---
{
    "title": "CONV",
    "language": "en"
}
---

## conv

### description
#### Syntax

```sql
VARCHAR CONV(VARCHAR input, TINYINT from_base, TINYINT to_base)
VARCHAR CONV(BIGINT input, TINYINT from_base, TINYINT to_base)
```
Convert the input number to the target base. The input base range should be within `[2,36]`. 

### example

```
MySQL [test]> SELECT CONV(15,10,2);
+-----------------+
| conv(15, 10, 2) |
+-----------------+
| 1111            |
+-----------------+

MySQL [test]> SELECT CONV('ff',16,10);
+--------------------+
| conv('ff', 16, 10) |
+--------------------+
| 255                |
+--------------------+

MySQL [test]> SELECT CONV(230,10,16);
+-------------------+
| conv(230, 10, 16) |
+-------------------+
| E6                |
+-------------------+
```

### keywords
	CONV
