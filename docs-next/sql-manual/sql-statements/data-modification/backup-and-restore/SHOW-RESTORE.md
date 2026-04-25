---
{
    "title": "SHOW RESTORE",
    "language": "en",
    "description": "This statement is used to view RESTORE tasks"
}
---

## Description

This statement is used to view RESTORE tasks

## Syntax

```SQL
SHOW [BRIEF] [GLOBAL] RESTORE [FROM <db_name>]
```

## Parameters

**1.`<db_name>`**

The name of the database to which the recovery task belongs.

## Return Value

- brief: only show key information of RESTORE tasks, columns RestoreObjs, Progress, TaskErrMsg will not show

| Column | Description |
| -- | -- |
| JobId | Unique job id |
| Label | The name of the backup to restore |
| Timestamp | The time version of the backup to restore |
| DbName | belongs to the database |
| State | current stage: <ul><li>PENDING: The initial state after submitting the job.</li><li>SNAPSHOTING: Executing snapshot.</li><li>DOWNLOAD: The snapshot is complete, ready to download the snapshot in the repository.</li><li>DOWNLOADING: Snapshot downloading.</li><li>COMMIT: Snapshot download is complete, ready to take effect.</li><li>COMMITTING: in effect.</li><li>FINISHED: Job finish time.</li><li>CANCELLED: Job failed.</li></ul> |
| AllowLoad | Whether to allow import when restoring (currently not supported)|
| ReplicationNum | Specifies the number of replicas to restore |
| ReserveReplica | Whether to keep a copy |
| ReplicaAllocation | Whether to keep dynamic partitioning enabled |
| RestoreJobs | Tables and partitions to restore |
| CreateTime | task submission time |
| MetaPreparedTime | Metadata preparation completion time |
| SnapshotFinishedTime | Snapshot completion time |
| DownloadFinishedTime | Snapshot download completion time |
| FinishedTime | Job finish time |
| UnfinishedTasks | Displays unfinished subtask ids during SNAPSHOTING, DOWNLOADING and COMMITING stages |
| Progress |  Task progress |
| TaskErrMsg | Display task error messages |
| Status | If the job fails, display the failure message |
| Timeout | Job timeout, in seconds |

## Example

1. View the latest RESTORE task under example_db.

```sql
SHOW RESTORE FROM example_db;
```

2. View the latest GLOBAL RESTORE task.

```sql
SHOW GLOBAL RESTORE;
```
