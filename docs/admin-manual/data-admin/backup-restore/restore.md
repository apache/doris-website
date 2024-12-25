---
{
    "title": "Restore",
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

## Prerequisites

1. Ensure you have **ADMIN** privileges to perform restore operations.
2. Ensure you have an existing **repository** that stores the backups. If not, follow the steps for creating a repository [here](create-repository.md) and execute a [backup](backup.md).
3. Ensure that you have a valid **backup** snapshot to restore from.

## 1. Restore from a Snapshot

### Option 1: Restore a Single Table from a Snapshot

Restore the table `backup_tbl` from backup snapshot `snapshot_1` in `example_repo` to database `example_db1`. Specify the time version as `"2018-05-04-16-45-08"`. Revert to 1 copy:

```sql
RESTORE SNAPSHOT example_db1.`snapshot_1`
FROM `example_repo`
ON ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29",
    "replication_num" = "1"
);
```

### Option 2: Restore partitions and table from a Snapshot

Restore partitions p1 and p2 of table backup_tbl in backup snapshot_2 from example_repo, and table backup_tbl2 to database example_db1, and rename it to new_tbl with time version "2018-05-04-17-11-01". The default reverts to 3 replicas:

   ```sql
   RESTORE SNAPSHOT example_db1.`snapshot_2`
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

## 2. View the execution of the restore job:

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

For detailed usage of RESTORE, please refer to [here](../../sql-manual/sql-statements/data-modification/backup-and-restore/RESTORE.md).

## Related Commands

The commands related to the backup and restore function are as follows. For the following commands, you can use `help cmd;` to view detailed help after connecting to Doris through mysql-client.

1. CREATE REPOSITORY (../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY.md)

2. RESTORE (../../sql-manual/sql-statements/data-modification/backup-and-restore/RESTORE.md)

3. SHOW RESTORE (../../sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-RESTORE.md)

4. CANCEL RESTORE (../../sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-RESTORE.md)

5. DROP REPOSITORY (../../sql-manual/sql-statements/data-modification/backup-and-restore/DROP-REPOSITORY.md)

## Common mistakes

1. Restore Report An Error:[20181: invalid md5 of downloaded file: /data/doris.HDD/snapshot/20220607095111.862.86400/19962/668322732/19962.hdr, expected: f05b63cca5533ea0466f62a9897289b5, get: d41d8cd98f00b204e9800998ecf8427e]

   If the number of copies of the table backed up and restored is inconsistent, you need to specify the number of copies when executing the restore command. For specific commands, please refer to [RESTORE](../../sql-manual/sql-statements/data-modification/backup-and-restore/RESTORE) command manual

2. Restore Report An Error:[COMMON_ERROR, msg: Could not set meta version to 97 since it is lower than minimum required version 100]

   Backup and restore are not caused by the same version, use the specified meta_version to read the metadata of the previous backup. Note that this parameter is used as a temporary solution and is only used to restore the data backed up by the old version of Doris. The latest version of the backup data already contains the meta version, so there is no need to specify it. For the specific solution to the above error, specify meta_version = 100. For specific commands, please refer to [RESTORE](../../sql-manual/sql-statements/data-modification/backup-and-restore/RESTORE) command manual

## More Help

For more detailed syntax and best practices used by RESTORE, please refer to the [RESTORE](../../sql-manual/sql-statements/data-modification/backup-and-restore/RESTORE) command manual, You can also type `HELP RESTORE` on the MySql client command line for more help.
