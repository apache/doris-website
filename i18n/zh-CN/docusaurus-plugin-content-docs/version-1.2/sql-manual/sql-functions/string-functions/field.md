---
{
    "title": "FIELD",
    "language": "zh-CN"
}
---

## field

<version since="dev">

field

</version>

## 描述
## 语法

`field(Expr e, param1, param2, param3,.....)`

在order by子句中，可以使用自定义排序，可以将expr中的数据按照指定的param1，2，3顺序排列。
不在param参数中的数据不会参与排序,将会放在最前面,可以使用asc,desc控制整体顺序。
如果有NULL值，可以使用nulls first,nulls last控制null的顺序


## 举例

```

mysql> select k1,k7 from baseall where k1 in (1,2,3) order by field(k1,2,1,3);
+------+------------+
| k1   | k7         |
+------+------------+
|    2 | wangyu14   |
|    1 | wangjing04 |
|    3 | yuanyuan06 |
+------+------------+
3 rows in set (0.02 sec)

mysql> select class_name from class_test order by field(class_name,'Suzi','Ben','Henry');
+------------+
| class_name |
+------------+
| Suzi       |
| Suzi       |
| Ben        |
| Ben        |
| Henry      |
| Henry      |
+------------+
```
### keywords
    field
