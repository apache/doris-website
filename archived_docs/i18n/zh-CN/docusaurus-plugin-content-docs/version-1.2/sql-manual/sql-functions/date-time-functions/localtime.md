---
{
    "title": "LOCALTIME,LOCALTIMESTAMP",
    "language": "zh-CN"
}
---

## localtime,localtimestamp
## 描述
## 语法

`DATETIME localtime()`
`DATETIME localtimestamp()`

获得当前的时间，以Datetime类型返回

## 举例

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
