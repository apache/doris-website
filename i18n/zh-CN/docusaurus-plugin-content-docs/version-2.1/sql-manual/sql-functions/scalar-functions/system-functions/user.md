---
{
    "title": "USER",
    "language": "zh-CN",
    "description": "获取 Doris 连接的当前用户名和 IP。"
}
---

## 描述

获取 Doris 连接的当前用户名和 IP。

## 语法

```sql
USER()
```

## 返回值

返回 Doris 连接的当前用户名和 IP。

格式：
`<user_name>@<ip>`

## 举例

```sql
select user();
```

```text
+---------------------+
| user()              |
+---------------------+
| 'root'@'10.244.2.5' |
+---------------------+
```

