---
{
    "title": "SHOW CREATE ROUTINE LOAD",
    "language": "en",
    "description": "This statement is used to display the creation statement of a routine load job."
}
---

## Description

This statement is used to display the creation statement of a routine load job.

The result shows the current consuming Kafka partitions and their corresponding offsets to be consumed. The result may not be a real-time consumption point, and should be based on the result of [show routine load](./SHOW-ROUTINE-LOAD.md).

## Syntax

```sql
SHOW [ALL] CREATE ROUTINE LOAD for <load_name>;
```

## Required Parameters

**1. `<load_name>`**

> The name of the routine load job

## Optional Parameters

**1. `[ALL]`**

> Optional parameter that represents retrieving all jobs, including historical jobs

## Access Control Requirements

Users executing this SQL command must have at least the following permission:

| Privilege  | Object | Notes                                                    |
| :--------- | :----- | :------------------------------------------------------- |
| LOAD_PRIV  | Table  | SHOW ROUTINE LOAD requires LOAD permission on the table |

## Examples

- Show the creation statement of a specified routine load job in the default database

   ```sql
   SHOW CREATE ROUTINE LOAD for test_load
   ```