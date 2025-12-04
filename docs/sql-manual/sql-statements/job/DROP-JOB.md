---
{
"title": "DROP JOB",
"language": "en"
}
---

## Description

The user deletes a JOB job. The job will be stopped and deleted immediately.

## Syntax

```sql
DROP JOB where jobName = <job_name> ;
```

## Required parameters

**1. `<job_name>`**
> The `<job_name>` of the task to be deleted.

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege | Object | ExecuteType | Notes |
|:--------------|:-----------|:------------------------|:------------------------|
| ADMIN_PRIV | Database | NO Streaming | Currently only supports **ADMIN** permissions to perform this operation |
| LOAD_PRIV | Database | Streaming |Supports **LOAD** permissions to perform this operation |


## Examples

- Delete the job named example.

    ```sql
    DROP JOB where jobName='example';
    ```