---
{
    "title": "FIELD",
    "language": "en"
}
---

## field

<version since="dev">

field

</version>

### description
#### Syntax

`field(Expr e, param1, param2, param3,.....)`


In the order by clause, you can use custom sorting to arrange the data in expr in the specified param1, 2, and 3 order.
The data not in the param parameter will not participate in sorting, but will be placed first. 
You can use asc and desc to control the overall order.
If there is a NULL value, you can use nulls first, nulls last to control the order of nulls.


### example

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
