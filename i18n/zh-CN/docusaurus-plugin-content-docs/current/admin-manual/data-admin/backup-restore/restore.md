---
{
    "title": "恢复",
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

## 前提条件

1. 确保您拥有**管理员**权限以执行恢复操作。
2. 确保您有一个现有的**存储库**来存储备份。如果没有，请按照[这里](create-repository.md)的步骤创建一个存储库，并执行[备份](backup.md)。
3. 确保您有一个有效的**备份**快照可以恢复。

## 1. 从快照恢复

### 选项1：从快照恢复单个表

从备份快照`snapshot_1`中将表`backup_tbl`恢复到数据库`example_db1`。指定时间版本为`"2018-05-04-16-45-08"`。恢复为1个副本：

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

### 选项2：从快照恢复分区和表

从`example_repo`中的备份快照`snapshot_2`恢复表`backup_tbl`的分区p1和p2，以及表`backup_tbl2`到数据库`example_db1`，并将其重命名为`new_tbl`，时间版本为`"2018-05-04-17-11-01"`。默认恢复为3个副本：

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

## 2. 查看恢复作业的执行情况：

   ```sql
   mysql> SHOW RESTORE\G;
   *************************** 1. row ***************************
                  JobId: 17891851
                  Label: snapshot_label1
              Timestamp: 2022-04-08-15-52-29
                 DbName: default_cluster:example_db1
                  State: FINISHED
              AllowLoad: false
         Replication
