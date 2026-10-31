---
{
    "title": "SHOW COLUMNS",
    "language": "zh-CN",
    "description": "该语句用于指定表的列信息"
}
---

## 描述

该语句用于指定表的列信息

## 语法

```sql
SHOW [ FULL ] COLUMNS FROM <tbl>;
```

## 必选参数
**1. `<tbl>`**

需要指定查看列信息的表名称。


## 可选参数
**1. `FULL`**

如果指定了 `FULL` 关键字，会返回列的详细信息，包括列的聚合类型、权限、注释等。

## 返回值
| 列名         | 类型      | 说明         |
|------------|---------|------------|
| Field      | varchar | 列名         |
| Type       | varchar | 列类型        |
| Collation  | varchar | 列的排序规则     |
| Null       | varchar | 是否允许为 NULL |
| Key        | varchar | 列的主键       |
| Default    | varchar | 默认值        |
| Extra      | varchar | 额外信息       |
| Privileges | varchar | 列的权限       |
| Comment    | varchar | 列的注释       |

## 权限控制
需要具备要查看的表的 `SHOW` 权限。

## 示例

1. 查看指定表详细的列信息

```sql
SHOW FULL COLUMNS FROM t_agg;
```
```text
+-------+-----------------+-----------+------+------+---------+---------+------------+---------+
| Field | Type            | Collation | Null | Key  | Default | Extra   | Privileges | Comment |
+-------+-----------------+-----------+------+------+---------+---------+------------+---------+
| k1    | tinyint         |           | YES  | YES  | NULL    |         |            |         |
| k2    | decimalv3(10,2) |           | YES  | YES  | 10.5    |         |            |         |
| v1    | char(10)        |           | YES  | NO   | NULL    | REPLACE |            |         |
| v2    | int             |           | YES  | NO   | NULL    | SUM     |            |         |
+-------+-----------------+-----------+------+------+---------+---------+------------+---------+
```

2. 查看指定表的普通列信息

```sql
SHOW COLUMNS FROM t_agg;
```
```text
+-------+-----------------+------+------+---------+---------+
| Field | Type            | Null | Key  | Default | Extra   |
+-------+-----------------+------+------+---------+---------+
| k1    | tinyint         | YES  | YES  | NULL    |         |
| k2    | decimalv3(10,2) | YES  | YES  | 10.5    |         |
| v1    | char(10)        | YES  | NO   | NULL    | REPLACE |
| v2    | int             | YES  | NO   | NULL    | SUM     |
+-------+-----------------+------+------+---------+---------+
```

