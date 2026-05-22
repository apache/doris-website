---
{
    "title": "FOREACH",
    "language": "zh-CN",
    "description": "将表的聚合函数转换为聚合相应数组项并返回结果数组的数组的聚合函数。例如，sumforeach 对于数组 [1, 2], [3, 4, 5]和[6, 7]返回结果 [10, 13, 5] 之后将相应的数组项添加在一起。"
}
---

## 描述
将表的聚合函数转换为聚合相应数组项并返回结果数组的数组的聚合函数。例如，`sum_foreach` 对于数组 [1, 2], [3, 4, 5]和[6, 7]返回结果 [10, 13, 5] 之后将相应的数组项添加在一起。

## 语法

`AGGREGATE_FUNCTION_FOREACH(arg...)`

## 举例
```
mysql [test]>select a , s from db;
+-----------+---------------+
| a         | s             |
+-----------+---------------+
| [1, 2, 3] | ["ab", "123"] |
| [20]      | ["cd"]        |
| [100]     | ["efg"]       |
| NULL      | NULL          |
| [null, 2] | [null, "c"]   |
+-----------+---------------+

mysql [test]>select sum_foreach(a) from db;
+----------------+
| sum_foreach(a) |
+----------------+
| [121, 4, 3]    |
+----------------+

mysql [test]>select count_foreach(s) from db;
+------------------+
| count_foreach(s) |
+------------------+
| [3, 2]           |
+------------------+

mysql [test]>select array_agg_foreach(a) from db;
+-----------------------------------+
| array_agg_foreach(a)              |
+-----------------------------------+
| [[1, 20, 100, null], [2, 2], [3]] |
+-----------------------------------+

mysql [test]>select map_agg_foreach(a,a) from db;
+---------------------------------------+
| map_agg_foreach(a, a)                 |
+---------------------------------------+
| [{1:1, 20:20, 100:100}, {2:2}, {3:3}] |
+---------------------------------------+
```
## 注意事项

- 每个参数都必须是 ARRAY，其元素类型需与被包裹聚合函数对应参数的类型一致；返回值是被包裹函数返回类型的 ARRAY，按下标逐位计算。
- 当一次调用传入多个数组参数时，同一行内的各数组长度必须相同，否则查询会报错 `Arrays passed to <function> aggregate function have different sizes`。（不同行之间的数组长度可以不同。）
- `percentile`、`percentile_array`、`percentile_approx`、`percentile_approx_weighted` 函数不支持与 `foreach` 组合器一起使用。

### keywords
FOREACH