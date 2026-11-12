---
{
    "title": "DATEV2",
    "language": "en"
}
---

## DATEV2

DATEV2

### Description
#### Syntax
datev2
DateV2 type, the current range of values is ['0000-01-01','9999-12-31'], and the default print form is 'yyyy-MM-dd'.

### note
DATEV2 type is more efficient than DATE type. During calculation, DATEV2 can save half of the memory usage compared with DATE.
Note that to maintain consistent behavior with MySQL, the date 0000-02-29 does not exist.
### example
```
SELECT CAST('2003-12-31 01:02:03' as DATEV2);
+---------------------------------------+
| CAST('2003-12-31 01:02:03' AS DATEV2) |
+---------------------------------------+
| 2003-12-31                            |
+---------------------------------------+
```

### keywords
DATE
