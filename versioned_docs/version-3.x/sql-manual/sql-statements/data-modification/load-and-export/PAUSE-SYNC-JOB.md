---
{
    "title": "PAUSE SYNC JOB",
    "language": "en",
    "description": "Pause a running resident data synchronization job in a database identified by jobname."
}
---

## Description

Pause a running resident data synchronization job in a database identified by `job_name`. The suspended job will stop synchronizing data while retaining its latest consumption position until it is resumed by the user.

## Syntax

```sql
PAUSE SYNC JOB [<db>.]<job_name>
```

## Required Parameters

**1. `<job_name>`**

> Specifies the name of the synchronization job to be paused.  

## Optional Parameters
**1. `<db>`**
> If a database is specified using the `[<db>.]` prefix, the job is located in that database; otherwise, the current database is used.

## Access Control Requirements  

Any user or role can perform this operation.

## Example

1. Pause the data synchronization job named `job_name`.

   ```sql
   PAUSE SYNC JOB `job_name`;
   ```
