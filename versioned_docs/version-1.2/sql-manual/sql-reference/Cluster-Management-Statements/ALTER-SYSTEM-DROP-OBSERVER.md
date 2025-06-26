---
{
    "title": "ALTER-SYSTEM-DROP-OBSERVER",
    "language": "en"
}
---

## ALTER-SYSTEM-DROP-OBSERVER

### Name

ALTER SYSTEM DROP OBSERVER

### Description

This statement is to delete the node of the OBSERVER role of FRONTEND, (only for administrators!)

grammar:

```sql
ALTER SYSTEM DROP OBSERVER "follower_host:edit_log_port"
```

illustrate:

1. host can be a hostname or an ip address
2. edit_log_port : edit_log_port in its configuration file fe.conf

### Example

1. Add a FOLLOWER node

    ```sql
    ALTER SYSTEM DROP OBSERVER "host_ip:9010"
    ```

### Keywords

    ALTER, SYSTEM, DROP, OBSERVER, ALTER SYSTEM

### Best Practice

