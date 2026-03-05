---
{
    "title": "ALTER-SYSTEM-DECOMMISSION-BACKEND",
    "language": "en"
}
---

## ALTER-SYSTEM-DECOMMISSION-BACKEND

### Name

ALTER SYSTEM DECOMMISSION BACKEND

### Description

The node offline operation is used to safely log off the node. The operation is asynchronous. If successful, the node is eventually removed from the metadata. If it fails, the logout will not be done (only for admins!)

grammar:

```sql
ALTER SYSTEM DECOMMISSION BACKEND "host:heartbeat_port"[,"host:heartbeat_port"...];
```

  illustrate:

1. host can be a hostname or an ip address
2. heartbeat_port is the heartbeat port of the node
3. The node offline operation is used to safely log off the node. The operation is asynchronous. If successful, the node is eventually removed from the metadata. If it fails, the logout will not be completed.
4. You can manually cancel the node offline operation. See CANCEL DECOMMISSION

### Example

1. Offline two nodes

    ```sql
    ALTER SYSTEM DECOMMISSION BACKEND "host1:port", "host2:port";
    ```

### Keywords

    ALTER, SYSTEM, DECOMMISSION, BACKEND, ALTER SYSTEM

### Best Practice

