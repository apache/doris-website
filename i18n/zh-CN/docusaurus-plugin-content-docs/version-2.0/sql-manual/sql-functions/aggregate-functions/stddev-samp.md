---
{
    "title": "STDDEV_SAMP",
    "language": "zh-CN"
}
---

## STDDEV_SAMP
## 描述
## 语法

`STDDEV_SAMP(expr)`


返回expr表达式的样本标准差

## 举例
```
MySQL > select stddev_samp(scan_rows) from log_statis group by datetime;
+--------------------------+
| stddev_samp(`scan_rows`) |
+--------------------------+
|        2.372044195280762 |
+--------------------------+
```
### keywords
STDDEV_SAMP,STDDEV,SAMP
