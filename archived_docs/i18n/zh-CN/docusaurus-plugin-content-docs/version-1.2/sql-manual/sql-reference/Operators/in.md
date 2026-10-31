---
{
    "title": "IN",
    "language": "zh-CN"
}
---

## IN

IN

## 描述
## 语法

`expr IN (value, ...)`

`expr IN (subquery)`

如果 expr 等于 IN 列表中的任何值则返回true，否则返回false。

subquery 只能返回一列，并且子查询返回的列类型必须 expr 类型兼容。

如果 subquery 返回bitmap数据类型列，expr必须是整型。

### 注意事项

- 当前仅向量化引擎中支持 in 子查询返回bitmap列。

## 举例

```
mysql> select id from cost where id in (1, 2);
+------+
| id   |
+------+
|    2 |
|    1 |
+------+
```
```
mysql> select id from tbl1 where id in (select id from tbl2);
+------+
| id   |
+------+
|    1 |
|    4 |
|    5 |
+------+
```
```
mysql> select id from tbl1 where id in (select bitmap_col from tbl3);
+------+
| id   |
+------+
|    1 |
|    3 |
+------+
```

### keywords

    IN
