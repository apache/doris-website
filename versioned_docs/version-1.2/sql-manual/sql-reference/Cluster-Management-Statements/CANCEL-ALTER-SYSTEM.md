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

```sql
CANCEL DECOMMISSION BACKEND "host:heartbeat_port"[,"host:heartbeat_port"...];
```

### Example

  1. Cancel the offline operation of both nodes:

      ```sql
      CANCEL DECOMMISSION BACKEND "host1:port", "host2:port";
      ```

### Keywords

    CANCEL, DECOMMISSION, CANCEL ALTER

### Best Practice

