---
{
"title": "CANCEL TASK",
"language": "en"
}

---

## Description

Cancel a running task created by the CREATE JOB statement.

- The task must be created by the CREATE JOB statement.
- It must be a running task.
- This function is supported from version 2.1.0.

## Syntax

```sql
CANCEL TASK WHERE jobName = '<job_name>' AND taskId = '<task_id>';
```
## Required Parameters

**<job_name>**

> The name of the job, of type string.

**<task_id>**

> The task ID, of integer type. It can be queried through the tasks table-valued function. For example: SELECT * FROM tasks('type'='insert'). For more information, please refer to "task table-valued function".

## Access Control Requirements

The user executing this SQL command must have at least ADMIN_PRIV privileges.

## Examples

Cancel a background task with jobName 'example' and taskId 378912.


```sql
CANCEL TASK WHERE jobName='example' AND taskId=378912
```