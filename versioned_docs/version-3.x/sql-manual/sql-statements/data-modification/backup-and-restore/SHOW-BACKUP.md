---
{
    "title": "SHOW BACKUP",
    "language": "en",
    "description": "This statement is used to view BACKUP tasks"
}
---

## Description

This statement is used to view BACKUP tasks

## Syntax

```sql
 SHOW BACKUP [FROM <db_name>]
     [WHERE SnapshotName { LIKE | = } '<snapshot_name>' ]
```

## Parameters

**1.`<db_name>`**

The name of the database to which the backup task belongs.

**2.`<snapshot_name>`**

Backup name.

## Return Value

| Column | Description |
| -- | -- |
| JobId | Unique job id |
| SnapshotName | The name of the backup |
| DbName | belongs to the database |
| State | current stage:<ul><li>PENDING: The initial state after submitting the job.</li><li>SNAPSHOTING: Executing snapshot.</li><li>UPLOAD_SNAPSHOT: Snapshot completed, ready to upload.</li><li>UPLOADING: Snapshot uploading.</li><li>SAVE_META: Save job meta information to a local file.</li><li>UPLOAD_INFO: Upload job meta information.</li><li>FINISHED: The job was successful.</li><li>CANCELLED: Job failed.</li></ul> |
| BackupObjs | Backed up tables and partitions |
| CreateTime | task submission time |
| SnapshotFinishedTime | Snapshot completion time |
| UploadFinishedTime | Snapshot upload completion time |
| FinishedTime | Job finish time |
| UnfinishedTasks | Displays unfinished subtask ids during SNAPSHOTING and UPLOADING stages |
| Progress |  Task progress |
| TaskErrMsg | Display task error messages |
| Status | If the job fails, display the failure message |
| Timeout | Job timeout, in seconds |

## Example

1. View the last BACKUP task under example_db.

```sql
SHOW BACKUP FROM example_db;
```
