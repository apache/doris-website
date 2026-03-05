---
{
    "title": "QUARTER",
    "language": "en"
}
---

## quarter
### description
#### Syntax

`INT quarter(DATETIME date)`

Returns the quarter to which the specified date belongs, as an INT

### Example

```
mysql> select quarter('2022-09-22 17:00:00');
+--------------------------------+
| quarter('2022-09-22 17:00:00') |
+--------------------------------+
|                              3 |
+--------------------------------+
```

### keywords

    quarter
