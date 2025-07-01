---
{
    "title": "EXPLODE",
    "language": "zh-CN"
}
---

## explode

## 描述

表函数，需配合 Lateral View 使用。

将 array 列展开成多行。当 array 为NULL或者为空时，`explode_outer` 返回NULL。
`explode` 和 `explode_outer` 均会返回 array 内部的NULL元素。

## 语法
```sql
explode(expr)
explode_outer(expr)
```

## 举例

```
mysql> select e1 from (select 1 k1) as t lateral view explode([1,2,3]) tmp1 as e1;
+------+
| e1   |
+------+
|    1 |
|    2 |
|    3 |
+------+

mysql> select e1 from (select 1 k1) as t lateral view explode_outer(null) tmp1 as e1;
+------+
| e1   |
+------+
| NULL |
+------+

mysql> select e1 from (select 1 k1) as t lateral view explode([]) tmp1 as e1;
Empty set (0.010 sec)

mysql> select e1 from (select 1 k1) as t lateral view explode([null,1,null]) tmp1 as e1;
+------+
| e1   |
+------+
| NULL |
|    1 |
| NULL |
+------+

mysql> select e1 from (select 1 k1) as t lateral view explode_outer([null,1,null]) tmp1 as e1;
+------+
| e1   |
+------+
| NULL |
|    1 |
| NULL |
+------+
```

### keywords
EXPLODE,EXPLODE_OUTER,ARRAY
