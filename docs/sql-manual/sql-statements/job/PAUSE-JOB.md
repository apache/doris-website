---
{
"title": "PAUSE JOB",
"language": "en"
}
---

## Description

When a user pauses a job in the RUNNING state, the running task will be interrupted and the job state will be changed to PAUSED. The stopped job can be resumed by the RESUME operation.

## Syntax

```sql
PAUSE JOB WHERE jobname = <job_name> ;
```

## Required parameters

**1. `<job_name>`**
> The name of the job to be paused.

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege | Object | Notes |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV | Database | Currently only supports **ADMIN** permissions to perform this operation |

## Examples

- Pause the job named example.

   ```sql 
   PAUSE JOB where jobname='example'; 
   ```