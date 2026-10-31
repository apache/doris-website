---
{
    "title": "DATE",
    "language": "en"
}
---

## DATE
### Description
DATE function

#### Syntax
Date
Convert input type to DATE type
date
Date type, the current range of values is ['0000-01-01','9999-12-31'], and the default print form is 'yyyy-MM-dd'.

### note
If you use version 1.2 and above, it is strongly recommended that you use the DATEV2 type instead of the DATE type as DATEV2 is more efficient than DATE type。

We intend to delete this type in 2024. At this stage, Doris prohibits creating tables containing the `DATE` type by default. If you need to use it, you need to add `disable_datev1 = false` in the FE's config and restart the FE.

### example

```sql
SELECT DATE('2003-12-31 01:02:03');
+-----------------------------+
| DATE('2003-12-31 01:02:03') |
+-----------------------------+
| 2003-12-31                  |
+-----------------------------+
```
### keywords
DATE
