---
{
    "title": "Restore",
    "language": "en",
    "description": "This guide explains how to restore a database, table, or partition in Doris from a backup snapshot in a Repository, with complete steps for querying snapshots, running RESTORE by scenario, and checking restore job progress.",
    "keywords": [
        "Doris restore",
        "RESTORE SNAPSHOT",
        "data recovery",
        "backup and restore",
        "SHOW SNAPSHOT",
        "SHOW RESTORE",
        "backup_timestamp",
        "cross-database restore",
        "partition restore",
        "table rename restore"
    ]
}
---

This guide explains how to use the Doris `RESTORE` statement to restore a database, table, or partition from a backup snapshot in an existing Repository, and how to track the progress of the restore job. It applies to scenarios such as data rollback, migration to a new cluster, cross-database replication, and table- or partition-level data repair.

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Data restore / Cross-database migration / Partition-level rollback -->

## Applicable Scenarios

| Scenario                                              | Recommended approach                                                | Description                                                                                |
|-------------------------------------------------------|---------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| Restore an entire snapshot to the current database    | [Restore a snapshot to the current database](#option-1-restore-a-snapshot-to-the-current-database)    | The most common case. Restores all objects in the snapshot to the database currently set with `USE`. |
| Restore an entire snapshot to another database        | [Restore a snapshot to a specified database](#option-2-restore-a-snapshot-to-a-specified-database)    | Used for cross-database migration or for keeping a copy of the data under another database. |
| Restore only a specific table from the snapshot       | [Restore a single table from a snapshot](#option-3-restore-a-single-table-from-a-snapshot)            | Used when you need to roll back or migrate only one specific table.                        |
| Restore specified partitions or rename the table on restore | [Restore partitions and tables from a snapshot](#option-4-restore-partitions-and-tables-from-a-snapshot) | Supports restoring only some partitions, and renaming tables on restore with `AS` to avoid overwriting existing objects. |

## Prerequisites

- You have **administrator** privileges to perform the restore operation.
- A usable backup snapshot exists. For backup operations, see [Backup](./backup).
- You know the name of the Repository where the backup is stored (the examples use `example_repo`).

## Restore Workflow Overview

1. Query the available snapshots in the target Repository to get the snapshot name and backup timestamp.
2. Based on your needs, choose a database-level, cross-database, single-table, or partition-level `RESTORE` statement to run the restore.
3. Use `SHOW RESTORE` to check the status and progress of the restore job, and confirm that the restore is complete.

## 1. Get the Backup Timestamp of a Snapshot

Before running a restore, you need to determine the snapshot name (Label) and the timestamp generated when the backup completed. The following SQL lists existing backups in a Repository named `example_repo`:

```sql
mysql> SHOW SNAPSHOT ON example_repo;
+--------------------+---------------------+--------+
| Snapshot           | Timestamp           | Status |
+--------------------+---------------------+--------+
| exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
+--------------------+---------------------+--------+
1 row in set (0.15 sec)
```

Output columns:

| Column    | Description                                                                                              |
|-----------|----------------------------------------------------------------------------------------------------------|
| Snapshot  | The Label of the snapshot, specified when the backup was created.                                        |
| Timestamp | The timestamp generated when the snapshot completed, used as the `backup_timestamp` argument of `RESTORE`. |
| Status    | The status of the snapshot in the Repository. `OK` means the snapshot is usable.                         |

## 2. Restore from a Snapshot

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Full-database restore / Cross-database restore / Single-table restore / Partition restore -->

Choose one of the following four options based on the scope of the objects to restore and the target location.

### Option 1: Restore a Snapshot to the Current Database

Restore the snapshot with Label `restore_label1` and timestamp `2022-04-08-15-52-29` from the Repository named `example_repo` to the current database:

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### Option 2: Restore a Snapshot to a Specified Database

Restore the same snapshot to a database named `destdb`. This can be used for cross-database migration or for keeping a copy of the data under another database:

```sql
RESTORE SNAPSHOT destdb.`restore_label1`
FROM `example_repo`
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### Option 3: Restore a Single Table from a Snapshot

From the snapshot in `example_repo` with Label `restore_label1` and timestamp `2022-04-08-15-52-29`, restore only the table `backup_tbl` to the current database:

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
ON ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### Option 4: Restore Partitions and Tables from a Snapshot

From backup snapshot `snapshot_2` in `example_repo`, restore partitions `p1` and `p2` of table `backup_tbl` and the table `backup_tbl2` to the current database `example_db1`, and rename `backup_tbl2` to `new_tbl`. The snapshot timestamp is `2018-05-04-17-11-01`:

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
ON
(
    `backup_tbl` PARTITION (`p1`, `p2`),
    `backup_tbl2` AS `new_tbl`
)
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-55-43"
);
```

### Key Parameters

| Parameter                            | Description                                                                                                                                  |
|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `SNAPSHOT <label>`                   | The Label of this restore job, used to identify it in `SHOW RESTORE`.                                                                        |
| `FROM <repo>`                        | The name of the Repository where the backup is stored.                                                                                       |
| `ON ( ... )`                         | Optional. Specifies the objects to restore. Can include table names, a `PARTITION (...)` clause, and an `AS <new_name>` rename clause. If omitted, all objects in the snapshot are restored. |
| `PROPERTIES("backup_timestamp"=...)` | Required. The timestamp of the snapshot to restore, corresponding to the `Timestamp` column in the output of `SHOW SNAPSHOT`.                |

## 3. Check the Progress of a Restore Job

Use `SHOW RESTORE` to view the status of restore jobs under the current database and the time spent in each phase:

```sql
    mysql> SHOW RESTORE\G;
    *************************** 1. row ***************************
                  JobId: 17891851
                  Label: snapshot_label1
              Timestamp: 2022-04-08-15-52-29
                  DbName: default_cluster:example_db1
                  State: FINISHED
              AllowLoad: false
          ReplicationNum: 3
            RestoreObjs: {
      "name": "snapshot_label1",
      "database": "example_db",
      "backup_time": 1649404349050,
      "content": "ALL",
      "olap_table_list": [
        {
          "name": "backup_tbl",
          "partition_names": [
            "p1",
            "p2"
          ]
        }
      ],
      "view_list": [],
      "odbc_table_list": [],
      "odbc_resource_list": []
    }
              CreateTime: 2022-04-08 15:59:01
        MetaPreparedTime: 2022-04-08 15:59:02
    SnapshotFinishedTime: 2022-04-08 15:59:05
    DownloadFinishedTime: 2022-04-08 15:59:12
            FinishedTime: 2022-04-08 15:59:18
        UnfinishedTasks:
                Progress:
              TaskErrMsg:
                  Status: [OK]
                Timeout: 86400
    1 row in set (0.01 sec)
```

Key fields:

| Field                              | Description                                                                                                                              |
|------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `JobId`                            | The internal ID of the restore job.                                                                                                      |
| `Label` / `Timestamp`              | The snapshot Label and backup timestamp that this restore corresponds to.                                                                |
| `DbName`                           | The target database.                                                                                                                     |
| `State`                            | The current state of the job. `FINISHED` means the restore succeeded.                                                                    |
| `RestoreObjs`                      | The objects included in this restore, such as table names, partition lists, views, and external tables.                                  |
| `CreateTime` and other time fields | The timestamps for job creation, metadata preparation, snapshot pulling, download, and final completion. Use them to troubleshoot bottlenecks. |
| `Status`                           | The error status. `[OK]` means no errors; otherwise, check `TaskErrMsg` for diagnosis.                                                   |
| `Timeout`                          | The job timeout, in seconds.                                                                                                             |
