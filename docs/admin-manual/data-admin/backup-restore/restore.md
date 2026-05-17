---
{
    "title": "Restore",
    "language": "en",
    "description": "The following SQL statement can be used to view existing backups in the Repository named examplerepo."
}
---

## Prerequisites

1. Ensure you have **administrator** privileges to perform the restore operation.
2. Ensure you have an existing **Repository** to store the backup. If not, follow the steps to create a Repository and perform a [backup](backup.md).
3. Ensure you have a valid **backup** snapshot available for restore.

## 1. Get the Backup Timestamp of the Snapshot

The following SQL statement can be used to view existing backups in the Repository named `example_repo`.

   ```sql
   mysql> SHOW SNAPSHOT ON example_repo;
   +-----------------+---------------------+--------+
   | Snapshot            | Timestamp              | Status   |
   +-----------------+---------------------+--------+
   | exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
   +-----------------+---------------------+--------+
   1 row in set (0.15 sec)
   ```

## 2. Restore from Snapshot

### Option 1: Restore Snapshot to Current Database

The following SQL statement restores the snapshot labeled `restore_label1` with the timestamp `2022-04-08-15-52-29` from the Repository named `example_repo` to the current database.

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### Option 2: Restore Snapshot to Specified Database

The following SQL statement restores the snapshot labeled `restore_label1` with the timestamp `2022-04-08-15-52-29` from the Repository named `example_repo` to a database named `destdb`.

```sql
RESTORE SNAPSHOT destdb.`restore_label1`
FROM `example_repo`
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### Option 3: Restore a Single Table from Snapshot

Restore the table `backup_tbl` from the snapshot in `example_repo` to the current database, with the snapshot labeled `restore_label1` and timestamp `2022-04-08-15-52-29`.

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
ON ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### Option 4: Restore Partitions and Tables from Snapshot

Restore partitions p1 and p2 of the table `backup_tbl`, as well as the table `backup_tbl2` to the current database `example_db1`, renaming it to `new_tbl`, from the backup snapshot `snapshot_2`, with the snapshot timestamp `"2018-05-04-17-11-01"`.

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

## 3. Check the Execution Status of the Restore Job

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
