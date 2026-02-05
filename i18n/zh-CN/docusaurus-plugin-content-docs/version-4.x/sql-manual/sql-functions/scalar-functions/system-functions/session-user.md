---
{
    "title": "SESSION_USER",
    "language": "zh-CN",
    "description": "获取 Doris 连接的当前用户名和 IP，兼容 MySQL 协议。"
}
---

## 描述

获取 Doris 连接的当前用户名和 IP，兼容 MySQL 协议。

## 语法

```sql
session_user()
```

## 返回值

返回 Doris 连接的当前用户名和 IP。
格式：`<user_name>@<ip>`

## 举例

```sql
select session_user();
```

```text
+----------------------+
| session_user()       |
+----------------------+
| 'root'@'10.244.2.10' |
+----------------------+
```
