---
{
    "title": "MAX",
    "language": "zh-CN"
}
---

## MAX
## 描述
## 语法

`MAX(expr)`


返回expr表达式的最大值

## 举例
```
MySQL > select max(scan_rows) from log_statis group by datetime;
+------------------+
| max(`scan_rows`) |
+------------------+
|          4671587 |
+------------------+
```
### keywords
MAX
