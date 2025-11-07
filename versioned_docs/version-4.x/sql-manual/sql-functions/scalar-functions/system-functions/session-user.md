---
{
    "title": "SESSION_USER",
    "language": "en"
}
---

## Description

Get the current username and IP of Doris connection, compatible with MySQL protocol.

## Syntax

```sql
SESSION_USER()
```

## Return Value

Returns the current username and IP Doris is connected to.
Format:`<user_name>@<ip>`

## Examples

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
