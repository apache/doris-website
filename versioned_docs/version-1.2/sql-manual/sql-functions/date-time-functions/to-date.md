---
{
    "title": "TO_DATE",
    "language": "en"
}
---

## to_date
### description
#### Syntax

`DATE TO_DATE(DATETIME)`

Return the DATE part of DATETIME value.

### example

```
mysql> select to_date("2020-02-02 00:00:00");
+--------------------------------+
| to_date('2020-02-02 00:00:00') |
+--------------------------------+
| 2020-02-02                     |
+--------------------------------+
```

### keywords

    TO_DATE
