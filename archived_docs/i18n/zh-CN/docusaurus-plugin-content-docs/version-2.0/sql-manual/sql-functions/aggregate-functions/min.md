---
{
    "title": "MIN",
    "language": "zh-CN"
}
---

## MIN
## 描述
## 语法

`MIN(expr)`


返回expr表达式的最小值

## 举例
```
MySQL > select min(scan_rows) from log_statis group by datetime;
+------------------+
| min(`scan_rows`) |
+------------------+
|                0 |
+------------------+
```
### keywords
MIN
