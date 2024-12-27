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
2. Ensure you have an existing **repository** that stores the backups. If not, follow the steps for creating a repository and execute a [backup](backup.md).
3. Ensure that you have a valid **backup** snapshot to restore from.

## 1. Getting Backup Timestamp For a Snapshot

  The following SQL statement can be used to view existing backups in a repository named `example_repo`.

   ```sql
   mysql> SHOW SNAPSHOT ON example_repo;
   +-----------------+---------------------+--------+
   | Snapshot        | Timestamp           | Status |
   +-----------------+---------------------+--------+
   | exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
   +-----------------+---------------------+--------+
   1 row in set (0.15 sec)
   ```

## 2. Restoring from a Snapshot

### Restoring a Snasphot

The following SQL statement restores a snapshot from a repository named `example_repo` with a specific backup timestamp.

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### Restore a Single Table from a Snapshot

Restore the table `backup_tbl` from the snapshot in `example_repo` to database  Specify the time version as `"2018-05-04-16-45-08"`.

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
ON ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### Restoring Partitions and Tables from a Snapshot

Restore partitions p1 and p2 of table backup_tbl in backup snapshot_2 from example_repo, and table backup_tbl2 to database example_db1, and rename it to new_tbl with time version "2018-05-04-17-11-01".

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

## 3. View the execution of the restore job:

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
