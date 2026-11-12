---
{
    "title": "CONNECTION_ID",
    "language": "zh-CN",
    "description": "获取当前 sql 客户端的连接编号。"
}
---

## 描述

获取当前 sql 客户端的连接编号。

## 语法

```sql
CONNECTION_ID()
```

## 返回值

当前 sql 客户端的连接编号。

## 举例

```sql
select connection_id();
```

```text
+-----------------+
| connection_id() |
+-----------------+
|             549 |
+-----------------+
```


