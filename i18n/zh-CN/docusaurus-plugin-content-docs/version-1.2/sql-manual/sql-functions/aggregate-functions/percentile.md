---
{
    "title": "PERCENTILE",
    "language": "zh-CN"
}
---

## 描述
## 语法

`PERCENTILE(expr, DOUBLE p)`

计算精确的百分位数，适用于小数据量。先对指定列降序排列，然后取精确的第 `p` 位百分数。`p` 的值介于 `0` 到 `1` 之间
如果 `p` 不指向精确的位置，则返回所指位置两侧相邻数值在 `p` 所指位置上产生的线性插值。注意这不是两数字的平均数。

参数说明
`expr`：必填。值为整数（最大为 `bigint`） 类型的列。
`p`：常量，必填。需要精确的百分位数。取值为 `[0.0,1.0]`。

## 举例

```sql
MySQL > select `table`, percentile(cost_time,0.99) from log_statis group by `table`;
+---------------------+---------------------------+
| table    |        percentile(`cost_time`, 0.99) |
+----------+--------------------------------------+
| test     |                                54.22 |
+----------+--------------------------------------+

MySQL > select percentile(NULL,0.3) from table1;
+-----------------------+
| percentile(NULL, 0.3) |
+-----------------------+
|                  NULL |
+-----------------------+
```

### Keywords
    PERCENTILE
