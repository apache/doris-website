---
{
    "title": "ALTER-SYSTEM-DROP-BROKER",
    "language": "en"
}

---

## ALTER-SYSTEM-DROP-BROKER

### Name

ALTER SYSTEM DROP BROKER

### Description

This statement is to delete the BROKER node, (administrator only)

grammar:

```sql
-- Delete all brokers
ALTER SYSTEM DROP ALL BROKER broker_name
-- Delete a Broker node
ALTER SYSTEM DROP BROKER broker_name "host:port"[,"host:port"...];
```

### Example

1. Delete all brokers

    ```sql
    ALTER SYSTEM DROP ALL BROKER broker_name
    ```

2. Delete a Broker node

    ```sql
    ALTER SYSTEM DROP BROKER broker_name "host:port"[,"host:port"...];
    ```

### Keywords

    ALTER, SYSTEM, DROP, FOLLOWER, ALTER SYSTEM

### Best Practice

