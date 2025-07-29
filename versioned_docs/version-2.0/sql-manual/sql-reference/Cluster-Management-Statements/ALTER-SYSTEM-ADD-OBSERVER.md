---
{
    "title": "ALTER-SYSTEM-ADD-OBSERVER",
    "language": "en"
}
---

## ALTER-SYSTEM-ADD-OBSERVER

### Name

ALTER SYSTEM ADD OBSERVER

### Description

This statement is to increase the node of the OBSERVER role of FRONTEND, (only for administrators!)

grammar:

```sql
ALTER SYSTEM ADD OBSERVER "follower_host:edit_log_port"
```

illustrate:

1. host can be a hostname or an ip address
2. edit_log_port : edit_log_port in its configuration file fe.conf

### Example

1. Add an OBSERVER node

    ```sql
    ALTER SYSTEM ADD OBSERVER "host_ip:9010"
    ```

### Keywords

    ALTER, SYSTEM, ADD, OBSERVER, ALTER SYSTEM

### Best Practice

