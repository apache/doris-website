---
{
    "title": "COUNT",
    "language": "zh-CN"
}
---

## COUNT
## 描述
## 语法

`COUNT([DISTINCT] expr)`


用于返回满足要求的行的数目

## 举例

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
