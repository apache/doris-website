---
{
    "title": "ALTER-SYSTEM-ADD-FOLLOWER",
    "language": "en"
}
---

## ALTER-SYSTEM-ADD-FOLLOWER

### Name

ALTER SYSTEM ADD FOLLOWER

### Description

This statement is to increase the node of the FOLLOWER role of FRONTEND, (only for administrators!)

grammar:

```sql
ALTER SYSTEM ADD FOLLOWER "follower_host:edit_log_port"
```

illustrate:

1. host can be a hostname or an ip address
2. edit_log_port : edit_log_port in its configuration file fe.conf

### Example

1. Add a FOLLOWER node

    ```sql
    ALTER SYSTEM ADD FOLLOWER "host_ip:9010"
    ```

### Keywords

    ALTER, SYSTEM, ADD, FOLLOWER, ALTER SYSTEM

### Best Practice

