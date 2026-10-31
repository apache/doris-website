---
{
    "title": "ANY_VALUE",
    "language": "zh-CN"
}
---

## ANY_VALUE

ANY_VALUE


## 描述
## 语法

`ANY_VALUE(expr)`

如果expr中存在非 NULL 值，返回任意非 NULL 值，否则返回 NULL。

别名函数： `ANY(expr)`

## 举例
```
mysql> select id, any_value(name) from cost2 group by id;
+------+-------------------+
| id   | any_value(`name`) |
+------+-------------------+
|    3 | jack              |
|    2 | jack              |
+------+-------------------+
```
### keywords
ANY_VALUE, ANY
