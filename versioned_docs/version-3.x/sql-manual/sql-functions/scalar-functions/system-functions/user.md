---
{
    "title": "USER",
    "language": "en",
    "description": "Get the current username and IP that Doris is connected to."
}
---

## Description

Get the current username and IP that Doris is connected to.

## Syntax

```sql
USER()
```

## Return Value

Returns the current username and IP Doris is connected to.
format:`<user_name>@<ip>`

## Examples

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

