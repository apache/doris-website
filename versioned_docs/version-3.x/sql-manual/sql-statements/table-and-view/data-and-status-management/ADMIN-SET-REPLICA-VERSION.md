---
{
    "title": "ADMIN SET REPLICA VERSION",
    "language": "en",
    "description": "This statement is used to manually set the version, last successful version, and last failed version of a specified replica."
}
---

## Description

This statement is used to manually set the version, last successful version, and last failed version of a specified replica. It is primarily used for recovering replicas from an abnormal state when an issue occurs in the system.

## Syntax

```sql
ADMIN SET REPLICA VERSION PROPERTIES ("<key>"="<value>" [,...])
```

## Required Parameters

** 1. `"<key>"="<value>"`**

| key          | value type | Notes                                                            |
|--------------|------------|------------------------------------------------------------------|
| `tablet_id`  | Int        | The ID of the tablet whose replica version needs to be modified. |
| `backend_id` | Int        | The ID of the BE node where the replica is located.              |


## Optional Parameters

** 1. `"<key>"="<value>"`**

| key                    | value type | Notes                                            |
|------------------------|------------|--------------------------------------------------|
| `version`              | Int        | Sets the version of the replica.                 |
| `last_success_version` | Int        | Sets the last successful version of the replica. |
| `last_failed_version`  | Int        | Sets the last failed version of the replica.     |


**Notes**

- If the specified replica does not exist, the operation will be ignored.
- 
- Modifying these values may cause subsequent data read and write failures, leading to data inconsistency. Please proceed with caution!

- Record the original values before making modifications. After making changes, verify table read and write operations. If they fail, revert to the original values. However, reverting may also fail.

- Do not perform this operation on a tablet that is currently writing data!


## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object   | Notes                                                                                                                            |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | Database | Required to execute administrative operations on the database, including managing tables, partitions, and system-level commands. |

## Examples

- Clear the failed status flag for the replica of tablet 10003 on BE 10001
  
  ```sql
  ADMIN SET REPLICA VERSION PROPERTIES("tablet_id" = "10003", "backend_id" = "10001", "last_failed_version" = "-1");
  ```

- Set the replica version of tablet 10003 on BE 10001 to 1004

  ```sql
  ADMIN SET REPLICA VERSION PROPERTIES("tablet_id" = "10003", "backend_id" = "10001", "version" = "1004");
  ```
