---
{
    "title": "VAR_SAMP,VARIANCE_SAMP",
    "language": "zh-CN"
}
---

## VAR_SAMP,VARIANCE_SAMP
## 描述
## 语法

`VAR_SAMP(expr)`


返回expr表达式的样本方差

## 举例
```
MySQL > select var_samp(scan_rows) from log_statis group by datetime;
+-----------------------+
| var_samp(`scan_rows`) |
+-----------------------+
|    5.6227132145741789 |
+-----------------------+
```

### keywords
VAR_SAMP,VARIANCE_SAMP,VAR,SAMP,VARIANCE
