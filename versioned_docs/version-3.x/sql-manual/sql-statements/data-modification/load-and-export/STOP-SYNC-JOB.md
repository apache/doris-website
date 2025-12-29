---
{
    "title": "STOP SYNC JOB",
    "language": "en",
    "description": "Stop a running resident data synchronization job in a database by specifying its jobname. Once stopped,"
}
---

## Description

Stop a running resident data synchronization job in a database by specifying its `job_name`. Once stopped, the job will cease synchronizing data and release its occupied resources.

## Syntax

```sql
STOP SYNC JOB [<db>.]<job_name>
```

## Required Parameters

**1. `<job_name>`**

> Specifies the name of the data synchronization job to be stopped.  

## Optional Parameters
**1. `<db>`**
> If a database is specified using the `[<db>.]` prefix, the job is located in that database; otherwise, the current database is used.


## Access Control Requirements  

Any user or role can perform this operation.


## Example

1. Stop the data synchronization job named `job_name`.

   ```sql
   STOP SYNC JOB `job_name`;
   ```
