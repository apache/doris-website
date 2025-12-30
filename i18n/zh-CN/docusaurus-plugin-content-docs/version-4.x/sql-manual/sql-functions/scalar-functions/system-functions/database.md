---
{
    "title": "DATABASE",
    "language": "zh-CN",
    "description": "获取当前 sql 客户端的连接的 database。"
}
---

## 描述

获取当前 sql 客户端的连接的 database。

## 别名

- SCHEMA

## 语法

```sql
DATABASE()
```
或

```sql
SCHEMA()
```

## 返回值

当前 sql 客户端的连接的 database 的名称。

## 举例

```sql
select database(),schema();
```

```text
+------------+------------+
| database() | database() |
+------------+------------+
| test       | test       |
+------------+------------+
```

