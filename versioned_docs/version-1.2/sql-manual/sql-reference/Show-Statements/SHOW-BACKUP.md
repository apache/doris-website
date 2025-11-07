---
{
    "title": "SHOW-BACKUP",
    "language": "en"
}
---

## SHOW-BACKUP

### Name

SHOW BACKUP

### Description

This statement is used to view BACKUP tasks

grammar:

```sql
 SHOW BACKUP [FROM db_name]
```

illustrate:

1. Only the most recent BACKUP task is saved in Doris.
1. The meaning of each column is as follows:
            JobId: Unique job id
            SnapshotName: The name of the backup
            DbName: belongs to the database
            State: current stage
                PENDING: The initial state after submitting the job
                SNAPSHOTING: Executing snapshot
                UPLOAD_SNAPSHOT: Snapshot completed, ready to upload
                UPLOADING: Snapshot uploading
                SAVE_META: Save job meta information to a local file
                UPLOAD_INFO: Upload job meta information
                FINISHED: The job was successful
                CANCELLED: Job failed
            BackupObjs: Backed up tables and partitions
            CreateTime: task submission time
            SnapshotFinishedTime: Snapshot completion time
            UploadFinishedTime: Snapshot upload completion time
            FinishedTime: Job finish time
            UnfinishedTasks: Displays unfinished subtask ids during SNAPSHOTING and UPLOADING stages
            Status: If the job fails, display the failure message
            Timeout: Job timeout, in seconds

### Example

1. View the last BACKUP task under example_db.

   ```sql
    SHOW BACKUP FROM example_db;
   ```

### Keywords

    SHOW, BACKUP

### Best Practice

