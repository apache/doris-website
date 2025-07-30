---
{
    "title": "POSITIVE",
    "language": "en"
}
---

## positive

### description
#### Syntax

```sql
BIGINT positive(BIGINT x)
DOUBLE positive(DOUBLE x)
DECIMAL positive(DECIMAL x)
```
Return `x`.

### example

```
mysql> SELECT positive(-10);
+---------------+
| positive(-10) |
+---------------+
|           -10 |
+---------------+
mysql> SELECT positive(12);
+--------------+
| positive(12) |
+--------------+
|           12 |
+--------------+
```

### keywords
	POSITIVE
