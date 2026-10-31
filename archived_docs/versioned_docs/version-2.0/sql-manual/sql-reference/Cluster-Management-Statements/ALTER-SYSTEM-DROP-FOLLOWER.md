---
{
    "title": "ALTER-SYSTEM-DROP-FOLLOWER",
    "language": "en"
}
---

## Name

ALTER SYSTEM DROP FOLLOWER

## Description

This statement is to delete the node of the FOLLOWER role of FRONTEND, (only for administrators!)

Grammar:

```sql
ALTER SYSTEM DROP FOLLOWER "follower_host:edit_log_port"
```

Illustration:

1. host can be a hostname or an ip address

2. edit_log_port : edit_log_port in its configuration file fe.conf

## Example

1. Delete a FOLLOWER node

    ```sql
    ALTER SYSTEM DROP FOLLOWER "host_ip:9010"
    ```

## Keywords

ALTER, SYSTEM, DROP, FOLLOWER, ALTER SYSTEM


