---
{
    "title": "VARIANCE,VAR_POP,VARIANCE_POP",
    "language": "zh-CN"
}
---

## VARIANCE,VAR_POP,VARIANCE_POP
## 描述
## 语法

`VARIANCE(expr)`


返回expr表达式的方差

## 举例
```
MySQL > select variance(scan_rows) from log_statis group by datetime;
+-----------------------+
| variance(`scan_rows`) |
+-----------------------+
|    5.6183332881176211 |
+-----------------------+

MySQL > select var_pop(scan_rows) from log_statis group by datetime;
+----------------------+
| var_pop(`scan_rows`) |
+----------------------+
|   5.6230744719006163 |
+----------------------+
```

### keywords
VARIANCE,VAR_POP,VARIANCE_POP,VAR,POP
