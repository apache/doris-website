---
{
    "title": "SUM",
    "language": "zh-CN"
}
---

## SUM
## 描述
## 语法

`SUM(expr)`


用于返回选中字段所有值的和

## 举例
```
MySQL > select sum(scan_rows) from log_statis group by datetime;
+------------------+
| sum(`scan_rows`) |
+------------------+
|       8217360135 |
+------------------+
```
### keywords
SUM
