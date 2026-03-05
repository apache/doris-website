---
{
    "title": "OUTER组合器",
    "language": "zh-CN"
}
---

## outer组合器

## 描述

在table function的函数名后面添加`_outer`后缀使得函数行为从`non-outer`变为`outer`,在表函数生成0行数据时添加一行`Null`数据。
## 语法
`explode_numbers(INT x)`

## 举例

```
mysql> select e1 from (select 1 k1) as t lateral view explode_numbers(0) tmp1 as e1;
Empty set

mysql> select e1 from (select 1 k1) as t lateral view explode_numbers_outer(0) tmp1 as e1;
+------+
| e1   |
+------+
| NULL |
+------+
```
### keywords

    outer
