---
{
    "title": "ALTER-SYSTEM-ADD-BACKEND",
    "language": "en"
}
---

## ALTER-SYSTEM-ADD-BACKEND

### Name

ALTER SYSTEM ADD BACKEND

### Description

This statement is used to manipulate nodes within a system. (Administrator only!)

grammar:

```sql
-- Add nodes (add this method if you do not use the multi-tenancy function)
   ALTER SYSTEM ADD BACKEND "host:heartbeat_port"[,"host:heartbeat_port"...];
```

 illustrate:

1. host can be a hostname or an ip address
2. heartbeat_port is the heartbeat port of the node
3. Adding and deleting nodes is a synchronous operation. These two operations do not consider the existing data on the node, and the node is directly deleted from the metadata, please use it with caution.

### Example

 1. Add a node

    ```sql
    ALTER SYSTEM ADD BACKEND "host:port";
    ```

### Keywords

    ALTER, SYSTEM, ADD, BACKEND, ALTER SYSTEM

### Best Practice

