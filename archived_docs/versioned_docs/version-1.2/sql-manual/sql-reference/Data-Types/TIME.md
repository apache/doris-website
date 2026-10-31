---
{
    "title": "TIME",
    "language": "en"
}
---

## TIME

### name

TIME

### description

TIME type
    `TIME` type that can appear as a query result. Table storage and manual CAST generation are not supported.
    When calculating without constant folding, it could represent `[-838:59:59, 838:59:59]`。

### example

```sql
mysql [(none)]> select timediff('2020-01-01', '2000-01-01');
+--------------------------------------------------------+
| timediff('2020-01-01 00:00:00', '2000-01-01 00:00:00') |
+--------------------------------------------------------+
| 175320:00:00                                           |
+--------------------------------------------------------+
1 row in set (0.00 sec)
```

### keywords

    TIME
