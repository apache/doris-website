---
{
    "title": "ADMIN SET REPLICA STATUS",
    "language": "en",
    "description": "This statement is used to set the status of a specified replica. Currently, it is only used for manually setting certain replica statuses to BAD,"
}
---

## Description

This statement is used to set the status of a specified replica. Currently, it is only used for manually setting certain replica statuses to `BAD`, `DROP`, or `OK`, allowing the system to automatically repair these replicas.

## Syntax

```sql
ADMIN SET REPLICA STATUS 
PROPERTIES ("tablet_id"="<tablet_id>","backend_id"="<backend_id>","status"="<status>")
```

## Required Parameters

**1. `<tablet_id>`**

The ID of the tablet whose replica status needs to be set.

**2. `<backend_id>`**

The ID of the BE node where the replica is located.

**3. `<status>`**

Currently, only the values "drop", "bad", and "ok" are supported.
If the specified replica does not exist or is already in a bad state, the operation will be ignored.

**Notes**：

- Setting a replica to BAD status

  A replica marked as BAD cannot be read or written. However, setting a replica to BAD may not always take effect. If the replica’s actual data is correct, and the BE reports the replica status as OK, the FE will automatically restore the replica back to OK. This operation may immediately delete the replica, so proceed with caution.


- Setting a replica to DROP status

  A replica marked as DROP can still be read and written. The system will first add a healthy replica on another machine before deleting the DROP replica. Compared to BAD, setting a replica to DROP is a safer operation.


## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object   | Notes                                                                                                                            |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | Database | Required to execute administrative operations on the database, including managing tables, partitions, and system-level commands. |


## Examples

- Set the replica of tablet 10003 on BE 10001 to bad

  ```sql
  ADMIN SET REPLICA STATUS PROPERTIES("tablet_id" = "10003", "backend_id" = "10001", "status" = "bad");
  ```

- Set the replica of tablet 10003 on BE 10001 to drop

  ```sql
  ADMIN SET REPLICA STATUS PROPERTIES("tablet_id" = "10003", "backend_id" = "10001", "status" = "drop");
  ```

- Set the replica of tablet 10003 on BE 10001 to ok

  ```sql
  ADMIN SET REPLICA STATUS PROPERTIES("tablet_id" = "10003", "backend_id" = "10001", "status" = "ok");
  ```