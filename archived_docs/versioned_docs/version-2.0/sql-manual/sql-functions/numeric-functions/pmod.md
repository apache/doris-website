---
{
    "title": "PMOD",
    "language": "en"
}
---

## pmod

### description
#### Syntax

```sql
BIGINT PMOD(BIGINT x, BIGINT y)
DOUBLE PMOD(DOUBLE x, DOUBLE y)
```
Returns the positive result of x mod y in the residue systems.
Formally, return `(x%y+y)%y`.

### example

```
MySQL [test]> SELECT PMOD(13,5);
+-------------+
| pmod(13, 5) |
+-------------+
|           3 |
+-------------+

MySQL [test]> SELECT PMOD(-13,5);
+-------------+
| pmod(-13, 5) |
+-------------+
|           2 |
+-------------+
```

### keywords
	PMOD
