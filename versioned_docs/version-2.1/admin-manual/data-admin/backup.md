---
{
    "title": "Data Backup",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# Data Backup

Doris supports backing up the current data in the form of files to the remote storage system like S3 and HDFS. Afterwards, you can restore data from the remote storage system to any Doris cluster through the restore command. Through this function, Doris can support periodic snapshot backup of data. You can also use this function to migrate data between different clusters.

This feature requires Doris version 0.8.2+

## A brief explanation of the principle

The backup operation is to upload the data of the specified table or partition directly to the remote warehouse for storage in the form of files stored by Doris. When a user submits a Backup request, the system will perform the following operations:

1. Snapshot and snapshot upload

   The snapshot phase takes a snapshot of the specified table or partition data file. After that, backups are all operations on snapshots. After the snapshot, changes, imports, etc. to the table no longer affect the results of the backup. Snapshots only generate a hard link to the current data file, which takes very little time. After the snapshot is completed, the snapshot files will be uploaded one by one. Snapshot uploads are done concurrently by each Backend.

2. Metadata preparation and upload

   After the data file snapshot upload is complete, Frontend will first write the corresponding metadata to a local file, and then upload the local metadata file to the remote warehouse through the broker. Completing the final backup job

3. Dynamic Partition Table Description

   If the table is a dynamic partition table, the dynamic partition attribute will be automatically disabled after backup. When restoring, you need to manually enable the dynamic partition attribute of the table. The command is as follows:

```sql
ALTER TABLE tbl1 SET ("dynamic_partition.enable"="true")
```

4. Backup and Restore operation will NOT keep the `colocate_with` property of a table.

## Start Backup

1. Create a hdfs remote warehouse example_repo (S3 skips step 1):

   ```sql
   CREATE REPOSITORY `example_repo`
   WITH HDFS
   ON LOCATION "hdfs://hadoop-name-node:54310/path/to/repo/"
   PROPERTIES
   (
   "fs.defaultFS"="hdfs://hdfs_host:port",
   "hadoop.username" = "hadoop"
   );
   ```

2. Create a remote repository for s3 : s3_repo (HDFS skips step 2)

   ```
   CREATE REPOSITORY `s3_repo`
   WITH S3
   ON LOCATION "s3://bucket_name/test"
   PROPERTIES
   (
       "AWS_ENDPOINT" = "http://xxxx.xxxx.com",
       "AWS_ACCESS_KEY" = "xxxx",
       "AWS_SECRET_KEY" = "xxx",
       "AWS_REGION" = "xxx"
   ); 
   ```

   >Note that.
   >
   >ON LOCATION is followed by Bucket Name here

3. Full backup of table example_tbl under example_db to warehouse example_repo:

   ```sql
   BACKUP SNAPSHOT example_db.snapshot_label1
   TO example_repo
   ON (example_tbl)
   PROPERTIES ("type" = "full");
   ```

4. Under the full backup example_db, the p1, p2 partitions of the table example_tbl, and the table example_tbl2 to the warehouse example_repo:

   ```sql
   BACKUP SNAPSHOT example_db.snapshot_label2
   TO example_repo
   ON
   (
      example_tbl PARTITION (p1,p2),
      example_tbl2
   );
   ```

5. View the execution of the most recent backup job:

   ```sql
   mysql> show BACKUP\G;
   *************************** 1. row ***************************
                  JobId: 17891847
           SnapshotName: snapshot_label1
                 DbName: example_db
                  State: FINISHED
             BackupObjs: [default_cluster:example_db.example_tbl]
             CreateTime: 2022-04-08 15:52:29
   SnapshotFinishedTime: 2022-04-08 15:52:32
     UploadFinishedTime: 2022-04-08 15:52:38
           FinishedTime: 2022-04-08 15:52:44
        UnfinishedTasks:
               Progress:
             TaskErrMsg:
                 Status: [OK]
                Timeout: 86400
   1 row in set (0.01 sec)
   ```

6. View existing backups in remote repositories:

   ```sql
   mysql> SHOW SNAPSHOT ON example_repo WHERE SNAPSHOT = "snapshot_label1";
   +-----------------+---------------------+--------+
   | Snapshot        | Timestamp           | Status |
   +-----------------+---------------------+--------+
   | snapshot_label1 | 2022-04-08-15-52-29 | OK     |
   +-----------------+---------------------+--------+
   1 row in set (0.15 sec)
   ```

For the detailed usage of BACKUP, please refer to [here](../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP.md).

## Best Practices

### Backup

Currently, we support full backup with the smallest partition (Partition) granularity (incremental backup may be supported in future versions). If you need to back up data regularly, you first need to plan the partitioning and bucketing of the table reasonably when building the table, such as partitioning by time. Then, in the subsequent running process, regular data backups are performed according to the partition granularity.

### Data Migration

Users can back up the data to the remote warehouse first, and then restore the data to another cluster through the remote warehouse to complete the data migration. Because data backup is done in the form of snapshots, new imported data after the snapshot phase of the backup job will not be backed up. Therefore, after the snapshot is completed and until the recovery job is completed, the data imported on the original cluster needs to be imported again on the new cluster.

It is recommended to import the new and old clusters in parallel for a period of time after the migration is complete. After verifying the correctness of data and services, migrate services to a new cluster.

## Highlights

1. Operations related to backup and recovery are currently only allowed to be performed by users with ADMIN privileges.
2. Within a database, only one backup or restore job is allowed to be executed.
3. Both backup and recovery support operations at the minimum partition (Partition) level. When the amount of data in the table is large, it is recommended to perform operations by partition to reduce the cost of failed retry.
4. Because of the backup and restore operations, the operations are the actual data files. Therefore, when a table has too many shards, or a shard has too many small versions, it may take a long time to backup or restore even if the total amount of data is small. Users can use `SHOW PARTITIONS FROM table_name;` and `SHOW TABLETS FROM table_name;` to view the number of shards in each partition and the number of file versions in each shard to estimate job execution time. The number of files has a great impact on the execution time of the job. Therefore, it is recommended to plan partitions and buckets reasonably when creating tables to avoid excessive sharding.
5. When checking job status via `SHOW BACKUP` or `SHOW RESTORE` command. It is possible to see error messages in the `TaskErrMsg` column. But as long as the `State` column is not `CANCELLED`, the job is still continuing. These tasks may retry successfully. Of course, some Task errors will also directly cause the job to fail.
6. If the recovery job is an overwrite operation (specifying the recovery data to an existing table or partition), then from the `COMMIT` phase of the recovery job, the overwritten data on the current cluster may no longer be restored. If the restore job fails or is canceled at this time, the previous data may be damaged and inaccessible. In this case, the only way to do it is to perform the recovery operation again and wait for the job to complete. Therefore, we recommend that if unnecessary, try not to restore data by overwriting unless it is confirmed that the current data is no longer used.

## Related Commands

1. The commands related to the backup and restore function are as follows. For the following commands, you can use `help cmd;` to view detailed help after connecting to Doris through mysql-client.

   1. CREATE REPOSITORY

      Create a remote repository path for backup or restore. Please refer to [Create Repository Reference](./../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY.md).

   2. BACKUP

      Perform a backup operation. Please refer to [Backup Reference](../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP.md).

   3. SHOW BACKUP

      View the execution of the most recent backup job. Please refer to [Show Backup Reference](../../sql-manual/sql-statements/Data-Definition-Statements/Backup-and-Restore/SHOW-BACKUP.md)。

   4. SHOW SNAPSHOT

      View existing backups in the remote repository. Please refer to [Show Snapshot Reference](../../sql-manual/sql-statements/Data-Definition-Statements/Backup-and-Restore/SHOW-SNAPSHOT.md).

   5. CANCEL BACKUP

      Cancel the currently executing backup job. Please refer to [Cancel Backup Reference] (../../sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP.md).

   6. DROP REPOSITORY

      Delete the created remote repository. Deleting a warehouse only deletes the mapping of the warehouse in Doris, and does not delete the actual warehouse data. Please refer to [Drop Repository Reference] (../../sql-manual/sql-statements/data-modification/backup-and-restore/DROP-REPOSITORY.md).

## More Help

 For more detailed syntax and best practices used by BACKUP, please refer to the [BACKUP](../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP.md) command manual, You can also type `HELP BACKUP` on the MySql client command line for more help.
