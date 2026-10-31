---
{
    "title": "CANCEL-ALTER-SYSTEM",
    "language": "en"
}
---

## CANCEL-ALTER-SYSTEM

### Name

CANCEL DECOMMISSION

### Description

This statement is used to undo a node offline operation. (Administrator only!)

grammar:

- Find backend through host and port

```sql
CANCEL DECOMMISSION BACKEND "host:heartbeat_port"[,"host:heartbeat_port"...];
```

- Find backend through backend_id

```sql
CANCEL DECOMMISSION BACKEND "id1","id2","id3...";
```

### Example

  1. Cancel the offline operation of both nodes:

      ```sql
      CANCEL DECOMMISSION BACKEND "host1:port", "host2:port";
      ```

 2. Cancel the offline operation of the node with backend_id 1:
    
    ```sql
        CANCEL DECOMMISSION BACKEND "1","2";
    ```

### Keywords

    CANCEL, DECOMMISSION, CANCEL ALTER

### Best Practice

