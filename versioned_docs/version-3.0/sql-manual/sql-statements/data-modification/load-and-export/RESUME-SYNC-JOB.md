---
{
    "title": "RESUME SYNC JOB",
    "language": "en"
}
---

## Description

Resume a resident data synchronization job that has been suspended in a database by its `job_name`. Once resumed, the job continues to synchronize data starting from the latest position before the suspension.

## Syntax

```sql
RESUME SYNC JOB [<db>.]<job_name>
```

## Required Parameters

**1. `<job_name>`**

> Specifies the name of the data synchronization job to be resumed.  

## Optional Parameters
**1. `<db>`**
> If a database is specified using the `[<db>.]` prefix, the job is located in that database; otherwise, the current database is used.


## Access Control Requirements  

Any user or role can perform this operation.


## Examples

1. Resume the data synchronization job named `job_name`.

   ```sql
   RESUME SYNC JOB `job_name`;
   ```
