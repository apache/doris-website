---
{
    "title": "Backup",
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

Doris supports backing up the current data in the form of files to the remote storage system. Afterwards, you can restore data from the remote storage system to any Doris cluster through the restore command. Through this function, Doris can support periodic snapshot backup of data. You can also use this function to migrate data between different clusters.

This feature requires Doris version 0.8.2+

## Permission Requirements

1. Operations related to backup and recovery are currently only allowed to be performed by users with ADMIN privileges.


## 1. Create a repository

   You can create a repository according to (create-repository.md).

## 2. Backup tables or db

### Option 1: Backup table example_tbl under example_db

   ```sql
   BACKUP SNAPSHOT example_db.snapshot_label1
   TO example_repo
   ON (example_tbl)
   PROPERTIES ("type" = "full");
   ```

### Option 2: Backup example_db, the p1, p2 partitions of the table example_tbl, and the table example_tbl2

   ```sql
   BACKUP SNAPSHOT example_db.snapshot_label2
   TO example_repo
   ON
   (
      example_tbl PARTITION (p1,p2),
      example_tbl2
   );
   ```

## 3. View the execution of the most recent backup job

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

## 4. View existing backups in remote repositories

   ```sql
   mysql> SHOW SNAPSHOT ON example_repo WHERE SNAPSHOT = "snapshot_label1";
   +-----------------+---------------------+--------+
   | Snapshot        | Timestamp           | Status |
   +-----------------+---------------------+--------+
   | snapshot_label1 | 2022-04-08-15-52-29 | OK     |
   +-----------------+---------------------+--------+
   1 row in set (0.15 sec)
   ```

For the detailed usage of BACKUP, please refer to [BACKUP](../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP.md).

## More Help

 For more detailed syntax and best practices used by BACKUP, please refer to the [BACKUP](../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP.md) command manual.
