---
{
    "title": "PAUSE ROUTINE LOAD",
    "language": "en"
}
---

## Description

This syntax is used to pause one or all Routine Load jobs. Paused jobs can be restarted using the RESUME command.

## Syntax

```sql
PAUSE [ALL] ROUTINE LOAD FOR <job_name>
```

## Required Parameters

**1. `<job_name>`**

> Specifies the name of the job to pause. If ALL is specified, job_name is not required.

## Optional Parameters

**1. `[ALL]`**

> Optional parameter. If ALL is specified, it indicates pausing all routine load jobs.

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
| :-------- | :----- | :---- |
| LOAD_PRIV | Table | SHOW ROUTINE LOAD requires LOAD privilege on the table |

## Notes

- After a job is paused, it can be restarted using the RESUME command
- The pause operation will not affect tasks that have already been dispatched to BE, these tasks will continue to complete

## Examples

- Pause a routine load job named test1.

   ```sql
   PAUSE ROUTINE LOAD FOR test1;
   ```

- Pause all routine load jobs.

   ```sql
   PAUSE ALL ROUTINE LOAD;
   ```