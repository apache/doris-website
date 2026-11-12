---
{
    "title": "STDDEV,STDDEV_POP",
    "language": "zh-CN"
}
---

## STDDEV,STDDEV_POP
## 描述
## 语法

`STDDEV(expr)`


返回expr表达式的标准差

## 举例
```
MySQL > select stddev(scan_rows) from log_statis group by datetime;
+---------------------+
| stddev(`scan_rows`) |
+---------------------+
|  2.3736656687790934 |
+---------------------+

MySQL > select stddev_pop(scan_rows) from log_statis group by datetime;
+-------------------------+
| stddev_pop(`scan_rows`) |
+-------------------------+
|      2.3722760595994914 |
+-------------------------+
```
### keywords
STDDEV,STDDEV_POP,POP
