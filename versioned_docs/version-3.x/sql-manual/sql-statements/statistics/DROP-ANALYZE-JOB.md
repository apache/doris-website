---
{
    "title": "DROP ANALYZE JOB",
    "language": "en"
}
---

## Description

Delete the history of the specified statistics collection job.

## Syntax

```sql
DROP ANALYZE JOB <job_id>
```

# Required Parameters

**<job_id>**

> Specifies the id of the job. You can obtain the job_id by running SHOW ANALYZE. For detailed usage, please refer to the "SHOW ANALYZE" section.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
| ----------- | ------ | ----- |
| SELECT_PRIV | Table  |       |

## Examples

Delete the statistics information job record with id 10036

```sql
DROP ANALYZE JOB 10036
```
