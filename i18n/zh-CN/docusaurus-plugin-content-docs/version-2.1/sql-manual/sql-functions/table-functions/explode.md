---
{
    "title": "EXPLODE",
    "language": "zh-CN",
    "description": "explode 函数接受一个数组，会将数组的每个元素映射为单独的行。通常与 LATERAL VIEW 配合使用，以将嵌套数据结构展开为标准的平面表格式。explode 和 explodeouter 区别主要在于空值处理。"
}
---

## 描述

`explode` 函数接受一个数组，会将数组的每个元素映射为单独的行。通常与 LATERAL VIEW 配合使用，以将嵌套数据结构展开为标准的平面表格式。`explode` 和 `explode_outer` 区别主要在于空值处理。

## 语法
```sql
EXPLODE(<array>)
EXPLODE_OUTER(<array>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<arr>` | array 类型 |

## 返回值

当数组不为空或 NULL 时，`explode` 和 `explode_outer` 的返回值相同。

当数据为空或 NULL 时：

`explode` 不会产生任何行，并且会过滤掉这些记录。

`explode_outer` 如果数组是空的，explode_outer 会生成一行记录，但展开的列值会是 NULL。如果数组为 NULL，同样会保留一行，并返回 NULL。

## 举例

```
select e1 from (select 1 k1) as t lateral view explode([1,2,3]) tmp1 as e1;
```

```text
+------+
| e1   |
+------+
|    1 |
|    2 |
|    3 |
+------+
```

```sql
select e1 from (select 1 k1) as t lateral view explode_outer(null) tmp1 as e1;
```

``` text
+------+
| e1   |
+------+
| NULL |
+------+
```

```sql
select e1 from (select 1 k1) as t lateral view explode([]) tmp1 as e1;
Empty set (0.010 sec)
```

```sql
select e1 from (select 1 k1) as t lateral view explode([null,1,null]) tmp1 as e1;
```

```text
+------+
| e1   |
+------+
| NULL |
|    1 |
| NULL |
+------+
```

```sql
select e1 from (select 1 k1) as t lateral view explode_outer([null,1,null]) tmp1 as e1;
```

```text
+------+
| e1   |
+------+
| NULL |
|    1 |
| NULL |
+------+
```