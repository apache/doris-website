---
{
    "title": "RESUME JOB",
    "language": "en",
    "description": "Restore the PAUSED job to the RUNNING state. The RUNNING job will be executed according to the scheduled period."
}
---

## Description

Restore the PAUSED job to the RUNNING state. The RUNNING job will be executed according to the scheduled period.

## Syntax

```sql
RESUME JOB where jobName = <job_name> ;
```
## Required parameters

**1. `<job_name>`**
> The `<job_name>` of the recovery task.

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege | Object | Notes |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV | Database | Currently only supports **ADMIN** permissions to perform this operation |

## Example

- Resume the job named example.

   ```sql
   RESUME JOB where jobName= 'example';
   ```
