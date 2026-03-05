---
{
    "title": "CURRENT_CATALOG",
    "language": "zh-CN",
    "description": "获取当前 sql 客户端的连接的 catalog。"
}
---

## 描述

获取当前 sql 客户端的连接的 catalog。

## 语法

```sql
CURRENT_CATALOG()
```

## 返回值

当前 sql 客户端的连接的 catalog 名称。

## 举例

```sql
select current_catalog();
```

```text
+-------------------+
| current_catalog() |
+-------------------+
| internal          |
+-------------------+
```

