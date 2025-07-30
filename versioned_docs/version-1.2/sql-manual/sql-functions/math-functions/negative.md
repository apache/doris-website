---
{
    "title": "NEGATIVE",
    "language": "en"
}
---

## negative

### description
#### Syntax

```sql
BIGINT negative(BIGINT x)
DOUBLE negative(DOUBLE x)
DECIMAL negative(DECIMAL x)
```
Return `-x`.

### example

```
mysql> SELECT negative(-10);
+---------------+
| negative(-10) |
+---------------+
|            10 |
+---------------+
mysql> SELECT negative(12);
+--------------+
| negative(12) |
+--------------+
|          -12 |
+--------------+
```

### keywords
	NEGATIVE
