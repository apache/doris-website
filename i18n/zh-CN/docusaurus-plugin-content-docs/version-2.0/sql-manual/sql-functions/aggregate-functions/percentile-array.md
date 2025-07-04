---
{
    "title": "PERCENTILE_ARRAY",
    "language": "zh-CN"
}
---

## PERCENTILE_ARRAY
## 描述
## 语法

`ARRAY_DOUBLE PERCENTILE_ARRAY(BIGINT, ARRAY_DOUBLE p)`

计算精确的百分位数，适用于小数据量。先对指定列降序排列，然后取精确的第 p 位百分数。
返回值为依次取数组p中指定的百分数组成的结果。
参数说明:
expr: 必填。值为整数（最大为bigint） 类型的列。
p: 需要精确的百分位数, 由常量组成的数组, 取值为 [0.0,1.0]。

## 举例
```
mysql> select percentile_array(k1,[0.3,0.5,0.9]) from baseall;
+----------------------------------------------+
| percentile_array(`k1`, ARRAY(0.3, 0.5, 0.9)) |
+----------------------------------------------+
| [5.2, 8, 13.6]                               |
+----------------------------------------------+
1 row in set (0.02 sec)

```

### keywords
PERCENTILE_ARRAY
