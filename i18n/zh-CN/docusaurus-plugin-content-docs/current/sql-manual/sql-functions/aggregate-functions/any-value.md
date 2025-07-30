---
{
    "title": "ANY_VALUE",
    "language": "zh-CN"
}
---

## 描述

返回分组中表达式或列的任意一个值。如果存在非 NULL 值，返回任意非 NULL 值，否则返回 NULL。

## 别名

- ANY

## 语法

```sql
ANY_VALUE(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 要聚合的列或表达式 |

## 返回值

如果存在非 NULL 值，返回任意非 NULL 值，否则返回 NULL。

## 举例

```sql
select id, any_value(name) from cost2 group by id;
```

```text
+------+-------------------+
| id   | any_value(`name`) |
+------+-------------------+
|    3 | jack              |
|    2 | jack              |
+------+-------------------+
```
