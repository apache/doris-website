---
{
    "title": "备份",
    "language": "zh-CN"
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

Doris支持将当前数据以文件的形式备份到远程存储系统。之后，您可以通过恢复命令从远程存储系统恢复数据到任何Doris集群。通过此功能，Doris可以支持数据的定期快照备份。您还可以使用此功能在不同集群之间迁移数据。

此功能需要Doris版本0.8.2及以上。

## 权限要求

1. 与备份和恢复相关的操作目前仅允许具有ADMIN权限的用户执行。

## 1. 创建一个存储库

   您可以根据(create-repository.md)创建一个存储库。

## 2. 备份表或数据库

### 选项1：备份example_db下的example_tbl

   ```sql
   BACKUP SNAPSHOT example_db.snapshot_label1
   TO example_repo
   ON (example_tbl)
   PROPERTIES ("type" = "full");
   ```

### 选项2：备份example_db、表example_tbl的p1、p2分区以及表example_tbl2

   ```sql
   BACKUP SNAPSHOT example_db.snapshot_label2
   TO example_repo
   ON
   (
      example_tbl PARTITION (p1,p2),
      example_tbl2
   );
   ```

## 3. 查看最近备份作业的执行情况

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

## 4. 查看远程存储库中的现有备份

   ```sql
   mysql> SHOW SNAPSHOT ON example_repo WHERE SNAPSHOT = "snapshot_label1";
   +-----------------+---------------------+--------+
   | Snapshot        | Timestamp           | Status |
   +-----------------+---------------------+--------+
   | snapshot_label1 | 2022-04-08-15-52-29 | OK     |
   +-----------------+---------------------+--------+
   1 row in set (0.15 sec)
   ```

## 更多帮助

有关BACKUP使用的更详细语法和最佳实践，请参阅[BACKUP](../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP.md)命令手册。
