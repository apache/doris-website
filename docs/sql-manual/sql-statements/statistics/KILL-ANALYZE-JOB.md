---
{
    "title": "KILL ANALYZE JOB",
    "language": "en",
    "description": "Stop the statistical information collection job that is being executed in the background."
}
---

## Description

Stop the statistical information collection job that is being executed in the background.

## Syntax

```sql
KILL ANALYZE <job_id>
```
## Required Parameters

**<job_id>**

> Specifies the id of the job. You can obtain the job_id of the job by using SHOW ANALYZE. For detailed usage, please refer to the "SHOW ANALYZE" chapter.

## Optional Parameters

None

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege (Privilege) | Object (Object) | Notes (Notes) |
| --------------------- | --------------- | ------------- |
| SELECT_PRIV           | Table           |               |

## Usage Notes

Jobs that have already been executed cannot be stopped.

## Examples

Stop the statistical information job record with an id of 10036

```sql
kill analyze 10036
```