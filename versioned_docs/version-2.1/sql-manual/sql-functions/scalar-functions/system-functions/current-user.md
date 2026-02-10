---
{
    "title": "CURRENT_USER",
    "language": "en",
    "description": "Get the current username and its IP rule whitelist."
}
---

## Description

Get the current username and its IP rule whitelist.

## Syntax

```sql
CURRENT_USER()
```

## Return Value

Returns the current username and its IP whitelist.

Format:`<user_name>@<ip_white_list>`

## Examples

- root user, no IP restrictions
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

- doris user, IP whitelist is 192.168.*
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

