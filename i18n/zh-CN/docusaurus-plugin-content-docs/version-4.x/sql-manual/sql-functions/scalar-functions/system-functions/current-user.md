---
{
    "title": "CURRENT_USER",
    "language": "zh-CN",
    "description": "获取当前的用户名及其 IP 白名单规则。"
}
---

## 描述

获取当前的用户名及其 IP 白名单规则。

## 语法

```sql
CURRENT_USER()
```

## 返回值

返回当前的用户名及其 IP 白名单。

格式：`<user_name>@<ip_white_list>`

## 举例

- root 用户，无 IP 限制
```sql
select current_user();
```

```text
+----------------+
| current_user() |
+----------------+
| 'root'@'%'     |
+----------------+
```

- doris 用户，IP 白名单为 192.168.*
```sql
select current_user();
```

```text
+---------------------+
| current_user()      |
+---------------------+
| 'doris'@'192.168.%' |
+---------------------+
```

