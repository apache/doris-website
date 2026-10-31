---
{
    "title": "ALTER-SYSTEM-DROP-BACKEND",
    "language": "en"
}
---

## ALTER-SYSTEM-DROP-BACKEND

### Name

ALTER SYSTEM DROP BACKEND

### Description

This statement is used to delete the BACKEND node (administrator only!)

grammar:

```sql
ALTER SYSTEM DROP BACKEND "host:heartbeat_port"[,"host:heartbeat_port"...]
```

illustrate:

1. host can be a hostname or an ip address
2. heartbeat_port is the heartbeat port of the node
3. Adding and deleting nodes is a synchronous operation. These two operations do not consider the existing data on the node, and the node is directly deleted from the metadata, please use it with caution.

### Example

1. Delete two nodes

    ```sql
    ALTER SYSTEM DROP BACKEND "host1:port", "host2:port";
    ```

### Keywords

    ALTER, SYSTEM, DROP, BACKEND, ALTER SYSTEM

### Best Practice

