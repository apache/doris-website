---
{
    "title": "LOCALTIME,LOCALTIMESTAMP",
    "language": "en"
}
---

## localtime,localtimestamp
### description
#### Syntax

`DATETIME localtime()`
`DATETIME localtimestamp()`

Get the current time and return it in Datetime type.

### Example

```
mysql> select localtime();
+---------------------+
| localtime()         |
+---------------------+
| 2022-09-22 17:30:23 |
+---------------------+

mysql> select localtimestamp();
+---------------------+
| localtimestamp()    |
+---------------------+
| 2022-09-22 17:30:29 |
+---------------------+
```

### keywords

    localtime,localtimestamp
