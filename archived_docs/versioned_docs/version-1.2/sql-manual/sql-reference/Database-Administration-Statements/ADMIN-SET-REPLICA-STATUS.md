---
{
    "title": "ADMIN-SET-REPLICA-STATUS",
    "language": "en"
}
---

## ADMIN-SET-REPLICA-STATUS

### Name

ADMIN SET REPLICA STATUS

### Description

This statement is used to set the state of the specified replica.

This command is currently only used to manually set the status of certain replicas to BAD or OK, allowing the system to automatically repair these replicas

grammar:

```sql
ADMIN SET REPLICA STATUS
        PROPERTIES ("key" = "value", ...);
```

 The following properties are currently supported:

1. "tablet_id": Required. Specify a Tablet Id.
2. "backend_id": Required. Specify Backend Id.
3. "status": Required. Specifies the state. Currently only "bad" or "ok" are supported

If the specified replica does not exist, or the status is already bad, it will be ignored.

> Note:
>
> The copy set to Bad status may be deleted immediately, please proceed with caution.

### Example

 1. Set the replica status of tablet 10003 on BE 10001 to bad.

       ```sql
    ADMIN SET REPLICA STATUS PROPERTIES("tablet_id" = "10003", "backend_id" = "10001", "status" = "bad");
       ```

2. Set the replica status of tablet 10003 on BE 10001 to ok.

   ```sql
   ADMIN SET REPLICA STATUS PROPERTIES("tablet_id" = "10003", "backend_id" = "10001", "status" = "ok");
   ```

### Keywords

    ADMIN, SET, REPLICA, STATUS

### Best Practice

