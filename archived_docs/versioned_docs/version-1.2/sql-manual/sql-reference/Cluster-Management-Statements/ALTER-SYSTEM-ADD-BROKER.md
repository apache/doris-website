---
{
    "title": "ALTER-SYSTEM-ADD-BROKER",
    "language": "en"
}

---

## ALTER-SYSTEM-ADD-BROKER

### Name

ALTER SYSTEM ADD BROKER

### Description

This statement is used to add a BROKER node. (Administrator only!)

grammar:

```sql
ALTER SYSTEM ADD BROKER broker_name "broker_host1:broker_ipc_port1","broker_host2:broker_ipc_port2",...;
```

### Example

1. Add two brokers

    ```sql
     ALTER SYSTEM ADD BROKER "host1:port", "host2:port";
    ```

### Keywords

    ALTER, SYSTEM, ADD, FOLLOWER, ALTER SYSTEM

### Best Practice

