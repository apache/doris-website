---
{
    "title": "COUNT",
    "language": "en"
}
---

## COUNT
### Description
#### Syntax

`COUNT([DISTINCT] expr)`


Number of rows used to return the required rows

### example

```
MySQL > select count(*) from log_statis group by datetime;
+----------+
| count(*) |
+----------+
| 28515903 |
+----------+

MySQL > select count(datetime) from log_statis group by datetime;
+-------------------+
| count(`datetime`) |
+-------------------+
|         28521682  |
+-------------------+

MySQL > select count(distinct datetime) from log_statis group by datetime;
+-------------------------------+
| count(DISTINCT `datetime`)    |
+-------------------------------+
|                       71045   |
+-------------------------------+
```
### keywords
COUNT
