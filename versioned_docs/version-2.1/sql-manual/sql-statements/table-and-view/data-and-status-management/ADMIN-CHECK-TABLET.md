---
{
    "title": "ADMIN CHECK TABLET",
    "language": "en",
    "description": "This statement is used to perform the specified check operation on a set of tablets."
}
---

## Description

This statement is used to perform the specified check operation on a set of tablets.

## Syntax

```sql
ADMIN CHECK TABLET ( <tablet_id> [,...] ) PROPERTIES("type" = "<type_value>")
```

## Required Parameters

**1. `<tablet_id>`**

The ID of the tablet on which the specified check operation will be performed.


## Optional Parameters

**1. `<type_value>`**

Currently, only consistency is supported.

- consistency:

  Checks the replica data consistency of the tablet. This command is asynchronous, meaning that after sending it, Doris will start executing the consistency check job for the corresponding tablet.

## Return Value

The final result of the statement will be reflected in the InconsistentNum column of the result from `SHOW PROC "/cluster_health/tablet_health";`.

| Column          | DataType | Note                                 |
|-----------------|----------|--------------------------------------|
| InconsistentNum | Int      | Number of tablets with inconsistency |


## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object   | Notes                                                                                                                            |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | Database | Required to execute administrative operations on the database, including managing tables, partitions, and system-level commands. |

## Examples
- Perform a replica data consistency check on a specified set of tablets

  ```sql
  admin check tablet (10000, 10001) PROPERTIES("type" = "consistency");
  ```

